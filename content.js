
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
        return
    }
    waitForElement('#main > div > div.chart-box', (target) => {
        const newDiv = document.createElement('div');
        newDiv.style.backgroundColor = 'white'
        // 创建图表容器
        // const chartDiv = document.createElement('div');
        // chartDiv.style.width = '100%';
        // chartDiv.style.height = '280px';
        // chartDiv.style.marginTop = '10px';
        // newDiv.appendChild(chartDiv);

        target.insertAdjacentElement('afterend', newDiv);


        localStorageData = window.localStorage.getItem('xmars-token');

        console.log('target', target);

        target.addEventListener('change', (e) => {
            console.log('✅ 触发 change:', e.target.value);
            renderBarChart(chartDiv, [5, 20, 36, 10, 100]);

        })

        let date = document.querySelector('#app > div > section > main > div > div.header-bar > div.right-part > span:nth-child(2) > span > div > span')
        let startDate
        let endDate
        if (date) {
            console.log('筛选日期：', date.textContent)
            startDate = date.textContent.split('~')[0].trim()
            endDate = date.textContent.split('~')[0].trim()
        }

        let fakeList = [];

        const body = {"profileId":"4030808021653559","resourceTypes":[],"operationTypes":[],"startDate":"2024-07-04","endDate":"2024-07-28","labelType":"or","labelIds":[],"txtType":"resource","txtVal":"","campaignId":5512944,"adTypes":["sponsoredProducts"],"orderBy":"","orderKey":"","page":1,"pageSize":25,"pagelimit":25}
        fetch('https://api.xnurta.com/changelog/search', {
            method: 'POST', // or POST
            body: JSON.stringify(body) ,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + JSON.parse(localStorageData)['jwt']
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log('✅ 请求成功：', data);
                if(data['status'] == 1){
                    fakeList = data['data']['record']
                }
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

            })
            .catch(err => {
                console.error('❌ 请求失败：', err);
            });


        // 加载 ECharts 并渲染
        // loadEcharts(() => {
        //   renderBarChart(chartDiv,[5, 20, 36, 10, 10]);
        // });



    });
}


window.onload = function () {
    const target = document.querySelector('#main > div > div.ai-group-page > div.data-wrapper > div.chart');
    if (target) {
        console.log('元素已加载:', target);
    } else {
        console.log('元素未找到');
    }
};

const observer = new MutationObserver((mutationsList, observer) => {
    const target = document.querySelector('#main > div > div.ai-group-page > div.data-wrapper > div.chart');
    if (target) {
        console.log('元素已加载2:', target);
        observer.disconnect(); // 一旦找到了目标元素，停止观察
    }
});

// 监听整个页面的 DOM 变化
observer.observe(document.body, { childList: true, subtree: true });


//   if(window.location.pathname='intelligenceCenter/ProductAdvertiseDepositNew'){
useWaitForElement()
//   }

window.addEventListener('popstate', (event) => {
    console.log('Hash Changed:', window.location.hash);
});


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


    // 全量显示按钮
    //   const showAllBtn = document.createElement('button');
    //   showAllBtn.textContent = showAll ? '分页显示' : '全量显示';
    //   showAllBtn.style.marginLeft = '10px';
    //   showAllBtn.onclick = () => {
    //     onPageSizeChange(showAll ? 10 : -1); // 切换全量/分页
    //   };
    //   controlDiv.appendChild(showAllBtn);

    //   container.appendChild(controlDiv);

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
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            td.style.border = '1px solid #ccc';
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





