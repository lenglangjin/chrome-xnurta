
function waitForElement(selector, callback) {
    const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
            clearInterval(timer);
            callback(el);
        }
    }, 100); // 每 100ms 检查一次
}

function getURLParam(url) {
    const params = new URL(url).searchParams;

    const aiGroupId = params.get('aiGroupId');
    const profileId = params.get('profileId');
    const tenantId = params.get('tenantId');
    const id = params.get('id');

    // 1. 获取并解码 breadcrumbs 参数
    const breadcrumbsRaw = params.get('breadcrumbs');
    const breadcrumbsDecoded = decodeURIComponent(breadcrumbsRaw);

    console.log('aiGroupId:', aiGroupId);
    console.log('profileId:', profileId);
    console.log('tenantId:', tenantId);
    return { aiGroupId, profileId, tenantId, id }
}


function useWaitForElement() {
    if (window.location.pathname !== '/allCampaigns/index/CampaignDetail') {
        return;
    }
    waitForElement('#main > div > div > div.main-content > div > div > div.main-table > div.chart-container', async (target) => {
        const newDiv = document.createElement('div');
        newDiv.style.backgroundColor = 'white';
        target.insertAdjacentElement('afterend', newDiv);

        console.log('===============================================')


        const url = window.location.href;
        let param = getURLParam(url)


        const localStorageData = window.localStorage.getItem('xmars-token');
        if (!localStorageData) {
            console.error('未获取到 token');
            return;
        }
        let jwt = '';
        try {
            jwt = JSON.parse(localStorageData)['jwt'];
        } catch (e) {
            console.error('token 解析失败', e);
            return;
        }

        ///////////////
        const asin = await getAsin(jwt, param['id'], param['tenantId']);
        console.log('asin:', asin)
        const price_result = await getLast30DaysPrice(asin)
        console.log('price_result:', price_result)

        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.height = '300px';
        target.insertAdjacentElement('afterend', div);
        if(price_result.x.length > 0 && price_result.y.length > 0){
            console.log("渲染柱状图")
            renderBarChart(div, price_result.x, price_result.y);
        }else{
            console.log("没有渲染柱状图")
            div.removeAttribute('style'); // 移除整个 style 属性
            div.innerHTML = "未找到统计数据"
        }

        ///////////////

        // 日期选择器
        const date = document.querySelector('#app > div > section > main > div > div.header-bar > div.right-part > span:nth-child(2) > span > div > span');
        let startDate = '';
        let endDate = '';
        if (date && date.textContent) {
            const dateArr = date.textContent.split('~').map(s => s.trim());
            startDate = dateArr[0] || '';
            endDate = dateArr[1] || '';
            console.log('筛选日期：', startDate, endDate);
        }

        // 监听日期变化
        // if (date) {
        //     date.addEventListener('change', (e) => {
        //         console.log('✅ 触发 change:', e.target.value);
        //         // renderBarChart(chartDiv, [5, 20, 36, 10, 123]);
        //     });
        // }
        if (date) {
            const observer = new MutationObserver(() => {
                const value = target.textContent.trim();
                const date = document.querySelector('#app > div > section > main > div > div.header-bar > div.right-part > span:nth-child(2) > span > div > span');
                console.log("日期变了", date.textContent)
            });

            observer.observe(date, {
                childList: true,
                characterData: true,
                subtree: true,
            });

        }

        // 请求数据
        let fakeList = [];




        body = {
            startDate: startDate || '2025-07-01',
            endDate: endDate || '2026-07-28',
            profileIds: [
                param['profileId']
            ],
            offset: '-7',
            tenantId: param['tenantId'],
            txtType: 'campaignName',
            filters: [
                {
                    field: 'aiCode',
                    operate: 'in',
                    values: [
                        param['aiGroupId']
                    ]
                },
                {
                    field: 'campaignType',
                    operate: 'in',
                    values: [
                        'sponsoredProducts',
                        'sponsoredBrands',
                        'sponsoredDisplay'
                    ]
                }
            ],
            resourceTypes: [],
            operationTypes: [],
            txtOp: 0,
            multiExactSearch: [],
            orderBy: '',
            orderKey: '',
            page: 1,
            pageSize: 20000,
            pagelimit: 20000
        }
        console.log("请求参数body:", body)
        const currentUrl = window.location.href;
        console.log('当前页面 URL:', currentUrl);
        try {
            const res = await fetch('https://api.xnurta.com/changelog/searchs', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + jwt,
                    'tenantId': param['tenantId']
                }
            });
            const data = await res.json();
            console.log('✅ 请求成功：', data);

            if (data['status'] == 1) {
                fakeList = data['data']['record'];
            }
        } catch (err) {
            console.error('❌ 请求失败：', err);
        }

        // 渲染表格
        const tableDiv = document.createElement('div');
        tableDiv.style.marginTop = '20px';
        newDiv.appendChild(tableDiv);

        // 分页逻辑
        let page = 1;
        let pageSize = 10;
        let showAll = false;
        const pageSizeOptions = [10, 20, 50, 100, 1000000000];

        function updateTable() {
            let displayData;
            if (pageSize === -1) {
                displayData = fakeList;
                showAll = true;
            } else {
                displayData = fakeList.slice((page - 1) * pageSize, page * pageSize);
                showAll = false;
            }
            renderTable(
                tableDiv,
                fakeList,
                fakeList,
                page,
                pageSize,
                fakeList.length,
                pageSizeOptions,
                (newPage) => { page = newPage; updateTable(); },
                (newPageSize) => { pageSize = newPageSize; page = 1; updateTable(); },
                showAll
            );
        }
        updateTable();
    });
}

useWaitForElement()


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("MP-VX-Insight ==> content.js ==> receive from popup2content msg -> ", message)
    let req = {
        type: "content2popup",
    }
    if ("initData" === message.action) {
        const fetchData = getContent()
        console.log("MP-VX-Insight ==> xnurta小助手获取到的数据：", fetchData)
        req.action = "afterFetchData"
        req.params = fetchData
        req.info = "抓取了页面上的数据"

        chrome.runtime.sendMessage(req, res => {
            console.log("MP-VX-Insight ==> content2popup then res -> ", res)
        })

        sendResponse("MP-VX-Insight ==> content.js 收到来自 popup.js 的消息")
    }

    if ("send" === message.action) {
        console.log("content收到来自popup到消息", message, sender)
        sendResponse("MP-VX-Insight ==> content.js 收到来自 popup.js 的消息")
    }


})


function loadEcharts(callback) {
    if (window.echarts) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('./js/echarts.min.js');
    script.onload = callback;
    document.documentElement.appendChild(script);
}

function renderBarChart(dom, datax,datay) {
    console.log("renderBarChart", dom, datax, datay)
    max = Math.max(...datay)
    min = Math.min(...datay)
    

    const myChart = echarts.init(dom);
    const option = {
        backgroundColor: '#fff', // 白色背景
        title: {
          text: '数量统计',
          left: 'center',
          textStyle: {
            fontSize: 18,
            fontWeight: 'bold', // 加粗
            color: '#333'
          }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(50,50,50,0.8)',
          borderRadius: 6,
          textStyle: {
            color: '#fff'
          }
        },
        grid: {
          top: 60,
          left: 50,
          right: 30,
          bottom: 60
        },
        xAxis: {
          type: 'category',
          data: datax,
          axisLine: { lineStyle: { color: '#999' } },
          axisLabel: { color: '#666' }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,      // 保证至少间隔为 1
        //   interval: 20, 
          max: max,
          min: 0,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#eee' } },
          axisLabel: { color: '#666' }
        },
        dataZoom: [
          { type: 'inside' },
          {
            type: 'slider',
            height: 20,
            bottom: 20,
            borderColor: '#ccc'
          }
        ],
        series: [{
          name: '数量',
          type: 'line',
          data: datay,
          smooth: true, // 平滑曲线
          sampling: 'average',
          showAllSymbol: false, // 避免点太密集
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#5470C6'
          },
          itemStyle: {
            color: '#5470C6'
          },
          areaStyle: {
            opacity: 0.1,
            color: '#5470C6'
          },
          markPoint: {
            symbol: 'pin',
            symbolSize: 50,
            label: {
              color: '#fff',
              fontWeight: 'bold'
            },
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' }
            ]
          }
        }]
      };
    myChart.setOption(option);
}

function generateFakeList(count = 25) {
    const list = [];
    for (let i = 1; i <= count; i++) {
        list.push({
            id: i,
            name: `名称${i}`,
            age: 20 + (i % 10),
            date: getRandomDate(new Date('2025-01-01'), new Date('2025-01-30')),
            gender: i % 2 === 0 ? '男' : '女',
            city: `城市${i % 5}`,
            phone: `1380000${1000 + i}`,
            email: `user${i}@test.com`,
            status: i % 3 === 0 ? '已激活' : '未激活',
            score: Math.floor(Math.random() * 100),
            remark: `备注${i}`
        });
    }
    return list;
}

function getRandomDate(start, end) {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    const randomDate = new Date(randomTime);
    // 格式化为 yyyy-mm-dd
    return randomDate.toISOString().split('T')[0];
}








function renderTable(container, allData, data, page, pageSize, total, pageSizeOptions, onPageChange, onPageSizeChange, showAll) {
    container.innerHTML = '';

    // 只展示这些字段
    const showFields = ['campaignName', 'resourceName', 'changeField', 'previousValue', 'newValue', 'changedDate', 'changedBy'];

    // ====== 新增：筛选控件 ======
    // 获取所有唯一的 resourceName 和 changeddate
    const resourceNames = Array.from(new Set(allData.map(item => item.resourceName).filter(Boolean)));
    const changedDates = Array.from(new Set(allData.map(item => item.changedDate).filter(Boolean)));
    const changedFields = Array.from(new Set(allData.map(item => item.changedField).filter(Boolean)));
    // 当前筛选值（用全局变量或挂在 container 上，避免每次渲染丢失）
    if (!container._selectedResource) container._selectedResource = '';
    if (!container._selectedDate) container._selectedDate = '';
    if (!container._selectedField) container._selectedField = '';
    // resourceName 筛选
    const resourceSelect = document.createElement('select');
    const resourceDefault = document.createElement('option');
    resourceDefault.value = '';
    resourceDefault.textContent = '全部资源';
    resourceSelect.appendChild(resourceDefault);
    resourceNames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (container._selectedResource === name) opt.selected = true;
        resourceSelect.appendChild(opt);
    });
    resourceSelect.onchange = () => {
        container._selectedResource = resourceSelect.value;
        onPageChange(1); // 筛选后回到第一页
    };
    container.appendChild(resourceSelect);


    // changedField 筛选
    const fieldSelect = document.createElement('select');
    const fieldDefault = document.createElement('option');
    fieldDefault.value = '';
    fieldDefault.textContent = 'all field';
    fieldSelect.appendChild(fieldDefault);
    changedFields.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (container._selectedField === name) opt.selected = true;
        fieldSelect.appendChild(opt);
    });
    changedFields.onchange = () => {
        container._selectedField = fieldSelect.value;
        onPageChange(1); // 筛选后回到第一页
    };
    container.appendChild(fieldSelect);

    // changeddate 筛选
    const dateSelect = document.createElement('select');
    const dateDefault = document.createElement('option');
    dateDefault.value = '';
    dateDefault.textContent = '全部日期';
    dateSelect.appendChild(dateDefault);
    const addedDates = new Set();
    changedDates.forEach(date => {
        date = (date || '').slice(0, 10);
        if (!addedDates.has(date)) {
            const opt = document.createElement('option');
            opt.value = date;
            opt.textContent = date;
            if (container._selectedDate === date) opt.selected = true;
            dateSelect.appendChild(opt);
            addedDates.add(date);
        }
    });
    dateSelect.onchange = () => {
        container._selectedDate = dateSelect.value;
        onPageChange(1); // 筛选后回到第一页
    };
    container.appendChild(dateSelect);

    // 每页显示数量选择
    const select = document.createElement('select');
    pageSizeOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt === -1 ? '全部' : opt;
        if (opt === pageSize) option.selected = true;
        select.appendChild(option);
    });
    select.onchange = () => {
        onPageSizeChange(Number(select.value));
    };
    container.appendChild(select);

    // ====== 数据筛选 ======
    let filteredData = data;
    if (container._selectedResource) {
        filteredData = filteredData.filter(item => item.resourceName === container._selectedResource);
    }
    if (container._selectedDate) {
        filteredData = filteredData.filter(item => (item.changedDate || '').slice(0, 10) === container._selectedDate);
    }
    if (container._selectedDate) {
        filteredData = filteredData.filter(item => (item.changedField || '').slice(0, 10) === container._changedField);
    }


    // ====== 分页处理 ======
    let displayData;
    if (pageSize === -1) {
        displayData = filteredData;
        showAll = true;
    } else {
        displayData = filteredData.slice((page - 1) * pageSize, page * pageSize);
        showAll = false;
    }

    // 表格
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '10px';

    // 表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    showFields.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.style.border = '1px solid #ccc';
        th.style.padding = '4px 8px';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 表体
    const tbody = document.createElement('tbody');
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        showFields.forEach(key => {
            const td = document.createElement('td');
            td.textContent = row[key] || '';
            td.style.border = '1px solid #006ccc';
            td.style.padding = '4px 8px';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.appendChild(table);

    // 分页按钮
    if (!showAll) {
        const pageDiv = document.createElement('div');
        pageDiv.style.textAlign = 'right';

        const totalPages = Math.max(1, Math.ceil(allData.length / pageSize));
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一页';
        prevBtn.disabled = page === 1;
        prevBtn.onclick = () => onPageChange(page - 1);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页';
        nextBtn.disabled = page === totalPages;
        nextBtn.onclick = () => onPageChange(page + 1);

        pageDiv.appendChild(prevBtn);
        pageDiv.appendChild(document.createTextNode(` 第${page}/${totalPages}页 `));
        pageDiv.appendChild(nextBtn);

        pageDiv.appendChild(document.createTextNode('每页显示：'));
        pageDiv.appendChild(select);

        container.appendChild(pageDiv);
    }

}

async function getAsin(authorization, id, tenantId) {
    try {
        const response = await fetch('https://api.xnurta.com/sparkxads/sa/product-ads/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authorization,
                'tenantId': tenantId
            },
            body: {
                "tenantId": 2064,
                "currency": "USD",
                "profileIds": [

                ],
                "startDate": "20250701",
                "endDate": "20250721",
                "prevStartDate": "20250610",
                "prevEndDate": "20250630",
                "keywordType": "campaign",
                "search": "",
                "filters": [
                    {
                        "field": "campaign",
                        "operate": "in",
                        "values": [
                            "sponsoredDisplay-" + id
                        ]
                    },
                    {
                        "field": "campaignType",
                        "operate": "in",
                        "values": [
                            "sponsoredProducts",
                            "sponsoredBrands",
                            "sponsoredDisplay"
                        ]
                    }
                ],
                "orderBy": "descending",
                "orderKey": "gapACOS",
                "page": 1,
                "pageSize": 200,
                "pagelimit": 200
            }
        });

        const result = await response.json();

        // 检查返回结果格式
        if (result.code === 0 && result.msg === "SUCCESS" && result.data && result.data.list.length > 0) {
            // 获取第0个元素的asin值
            const firstAsin = result.data.list[0].asin;
            console.log('获取到的ASIN:', firstAsin);
            return firstAsin; s
        } else {
            console.error('接口返回异常:', result);
            return null;
        }
    } catch (error) {
        console.error('请求失败:', error);
        return null;
    }

}
const KEEP_API_KEY = "rs8ufu9ncf6uhcl01iklp0sivn67r5b02c409clo0d7ik6jc4v5po3alktd1d8r6";

function keepaMinuteToDate(minutes) {
    const epochStart = new Date("2011-01-01T00:00:00Z").getTime();
    return new Date(epochStart + minutes * 60000);
}

async function getLast30DaysPrice(asin) {
    const url = `https://api.keepa.com/product?key=${KEEP_API_KEY}&domain=1&asin=${asin}&days=30&stats=180`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('url:', url)
    console.log('keep product data:', data)

    if (!data.products || data.products.length === 0) {
        console.log("没有找到商品");
        return;
    }

    const product = data.products[0];
    const priceHistory = product.csv[0] || []; // 新品价格历史

    console.log('priceHistory:', priceHistory)

    const now = Date.now();
    const last30Days = now - 30 * 24 * 60 * 60 * 1000;

    let x = [];
    let y = [];
    for (let i = 0; i < priceHistory.length; i += 2) {
        const time = keepaMinuteToDate(priceHistory[i]).getTime();
        const price = priceHistory[i + 1] / 100; // 转换成美元

        if (time >= last30Days) {
            x.push(new Date(time).toISOString().slice(0, 10));
            y.push(price);
        }
    }

    return {x:x,y:y};
}


