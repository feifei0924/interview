var log = console.log.bind()

var templateDiv = function(name) {
    var t = `
    <div style="position: absolute;font-size: 12px;top: 50%;left: 45%;transform: translateY(-50%) translateX(-50%);">
        ${name}
    </div>
    `
    return t
}

var indexDiv = function(index) {
    var choose = '#id-div-' + index
    var e = document.querySelector(choose)
    return e
}

var insertDiv = function(location, arr) {
        location.insertAdjacentHTML('beforeend', arr)
}

var childNodes = function(div) {
    var nodes = div.childNodes
    //去掉换行的空格
    for(var i=0; i<nodes.length;i++){
        if(nodes[i].nodeName == "#text" && !/\s/.test(nodes.nodeValue)){
            div.removeChild(nodes[i]);
        }
    }
    var childs= div.childNodes
    return childs
}

var changeClass = function(nodes, color) {
    // 改变class
    nodes[0].classList.add(color)
    nodes[1].classList.remove("mini-triangle")
    nodes[1].classList.add("mini-" + color + "-triangle")
}

var __main = function() {
    var arr =  [
        {"name":"待接单","status":"WAIT_ACCEPT","isShadowed":true},
        {"name":"待发货","status":"WAIT_DELIVER","isShadowed":true,"isCurrentStatus":true},
        {"name":"验货入库","status":"STOCK_IN"},
        {"name":"已完成","status":"DELIVERED"}
    ]

    if (arr.length == 1) {
        var t = `
            <div class="discontinue">
                已中止
            </div>
        `
        var body = document.querySelector("body")
        insertDiv(body, t)
    }

    for (var i = 0; i < arr.length; i++) {
        var a = arr[i]
        var currentDiv = indexDiv(i)
        var name = a.name
        var tem = templateDiv(name)
        insertDiv(currentDiv, tem)

        var childs = childNodes(currentDiv)
        if (a.isShadowed) {
            changeClass(childs, "gray")
        }
        if (a.isCurrentStatus) {
            changeClass(childs, "blue")
        }
    }
}

__main()
