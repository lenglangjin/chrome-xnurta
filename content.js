
function waitForElement(selector, callback) {
    const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
            clearInterval(timer);
            callback(el);
        }
    }, 100); // 每 100ms 检查一次
}


function useWaitForElement() {
    if (window.location.pathname !== '/intelligenceCenter/AIBoard') {
        return;
    }
    waitForElement('#main > div > div.chart-box', async (target) => {
        const newDiv = document.createElement('div');
        newDiv.style.backgroundColor = 'white';
        target.insertAdjacentElement('afterend', newDiv);

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
        if (date) {
            date.addEventListener('change', (e) => {
                console.log('✅ 触发 change:', e.target.value);
                // renderBarChart(chartDiv, [5, 20, 36, 10, 123]);
            });
        }

        // 请求数据
        let fakeList = [];
        const body = {
            profileId: '4030808021653559',
            resourceTypes: [],
            operationTypes: [],
            startDate: startDate || '2024-07-04',
            endDate: endDate || '2024-07-28',
            labelType: 'or',
            labelIds: [],
            txtType: 'resource',
            txtVal: '',
            campaignId: 5512944,
            adTypes: ['sponsoredProducts'],
            orderBy: '',
            orderKey: '',
            page: 1,
            pageSize: 25,
            pagelimit: 25
        };
        try {
            const res = await fetch('https://api.xnurta.com/changelog/search', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + jwt
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
        const pageSizeOptions = [10, 20, 50, 100];

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
                displayData,
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


// window.onload = function () {
//     const target = document.querySelector('#main > div > div.ai-group-page > div.data-wrapper > div.chart');
//     if (target) {
//         console.log('元素已加载:', target);
//     } else {
//         console.log('元素未找到');
//     }
// };

// const observer = new MutationObserver((mutationsList, observer) => {
//     const target = document.querySelector('#main > div > div.ai-group-page > div.data-wrapper > div.chart');
//     if (target) {
//         console.log('元素已加载2:', target);
//         observer.disconnect(); // 一旦找到了目标元素，停止观察
//     }
// });

// 监听整个页面的 DOM 变化
// observer.observe(document.body, { childList: true, subtree: true });


useWaitForElement()


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("MP-VX-Insight ==> content.js ==> receive from popup2content msg -> ", message)
    let req = {
        type: "content2popup",
    }
    if ("initData" === message.action) {
        const fetchData = getContent()
        console.log("MP-VX-Insight ==> 微信小助手获取到的数据：", fetchData)
        req.action = "afterFetchData"
        req.params = fetchData
        req.info = "抓取了页面上的数据"
    }

    chrome.runtime.sendMessage(req, res => {
        console.log("MP-VX-Insight ==> content2popup then res -> ", res)
    })

    sendResponse("MP-VX-Insight ==> content.js 收到来自 popup.js 的消息")
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

function renderBarChart(dom, data) {
    const myChart = echarts.init(dom);
    const option = {
        title: { text: '示例柱状图' },
        tooltip: {},
        xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
        yAxis: {},
        series: [{
            name: '数量',
            type: 'bar',
            data: data
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

const randomDate = getRandomDate(new Date('2025-01-01'), new Date('2025-01-30'));







function renderTable(container, data, page, pageSize, total, pageSizeOptions, onPageChange, onPageSizeChange, showAll) {
    container.innerHTML = '';



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



    const dateSelect = document.createElement('select');
    for (let i = 0; i < 30; i++) {
        const dateOption = document.createElement('option')
        dateOption.value = i
        dateOption.textContent = i
        dateSelect.appendChild(dateOption)
    }
    container.appendChild(dateSelect)

    // 表格
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '10px';

    // 表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.keys(data[0] || {}).forEach(key => {
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
    //遍历数据
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
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

        const totalPages = Math.ceil(total / pageSize);
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

        // 分页控件
        // const controlDiv = document.createElement('div');
        // controlDiv.style.marginBottom = '10px';
        pageDiv.appendChild(document.createTextNode('每页显示：'));
        pageDiv.appendChild(select);

        container.appendChild(pageDiv);


    }
}