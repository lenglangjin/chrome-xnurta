console.log("MP-VX-Insight ==> loading popup.js")

const alertCVMSG = "Copy successfully! You can use Ctrl+v or Command+V to do so!"

function initializeData() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {

        if (tabs.length > 0) {
            const currentUrl = tabs[0].url
            const parsedUrl = new URL(currentUrl)
            const currentDomain = parsedUrl.hostname
            if ("ai.xnurta.com" !== currentDomain) {
                alert("请在xnurta中打开")
                window.close()
                return null
            }

            const req = {
                type: "popup2content",
                action: "initData",
                info: "初始化 popup.html 页面数据"
            }
            chrome.tabs.sendMessage(tabs[0].id, req, res => {
                console.log("MP-VX-Insight ==> popup2content then res -> ", res)
            })
        }

    })
}


function send(){
    
    chrome.tabs.query({active:true,currentUrl:true},(tabs)=>{
        chrome.tabs.sendMessage(tabs[0].id,{action:"send"},(res)=>{
            console.log("button1收到消息",response)
        })
    })
    chrome.runtime.sendMessage({action:"send"},(response)=>{
        console.log("button收到消息",response)
    }) 
}



document.addEventListener("DOMContentLoaded", () => {
    console.log("MP-VX-Insight ==> Start!")

    registerButtonListener("send",send)

    initializeData()

})




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("popup中addListener执行", message)

    if ("afterFetchData" === message.action) {
        coverData(message.params)
    }

    sendResponse("MP-VX-Insight ==> popup.js 收到来自 content.js 的消息")
})
