function listenallimg(){
    for (var img of Array.from(document.querySelectorAll('img'))) {
        if (img.id != "avatar") img.onclick = viewimg; 
    }
}

function viewimg(){
    var doc = document.documentElement;
    var sleft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    var stop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

    var bg = document.createElement("div");

    bg.style.background = "none repeat scroll 0% 0% rgba(0, 0, 0 , 0.5)";
    bg.style.position = "absolute";
    bg.style.left = sleft.toString() + "px";
    bg.style.top = stop.toString() + "px";
    bg.style.width = "100%";
    bg.style.height = "100%";
    bg.style.zIndex = "999";
    bg.onclick = function(){document.body.removeChild(this);};

    var imgele = document.createElement("img");
    var img = new Image();
    var disp = document.createElement("div");

    disp.style.width = "100%";
    disp.style.height = "100%";
    disp.style.textAlign = "center";
    bg.appendChild(disp);
    document.body.appendChild(bg);

    imgele.src = this.src;
    imgele.style.maxHeight = disp.clientHeight.toString() + "px";
    imgele.style.maxWidth = disp.clientWidth.toString() + "px";

    disp.appendChild(imgele);
}
