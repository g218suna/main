var wW, wH, eW, eH;

function getWindowSize() {
    wW = window.innerWidth - 33;
    wH = window.innerHeight - 300;
    eW = document.documentElement.clientWidth;
    eH = document.documentElement.clientHeight;
    //console.log(wW, wH, eW, eH);
    document.getElementById("mindmap").width = wW;
    document.getElementById("mindmap").height = wH;
}

getWindowSize();

//window.onresize = getWindowSize;

var canvas = document.getElementById('mindmap');
var ctx = canvas.getContext("2d");

var objs_wds = document.getElementsByClassName("wds");
var wds = Array.from(objs_wds);
var num_wds = document.getElementById("width");

var objs_cls = document.getElementsByClassName("cls");
var cls = Array.from(objs_cls);
var num_cls = document.getElementById("color");
var save_c10 = document.getElementById("c10");
var save_c11 = document.getElementById("c11");
var save = document.getElementById("save");

var el = document.getElementById("mindmap");
var drawing = false;

var bgColor = "rgb(255,255,255)";

function setBgColor() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, wW, wH);
}

setBgColor();

/* 描画の終了 */
var wStop = () => {
    drawing = false;
    ctx.closePath();
};
/* マウスボタンを離した時 */
canvas.onmouseup = wStop;
/* タッチ終了時 */
canvas.ontouchend = wStop;

/* ラインを描画 */
var wLine = (e) => {
    var target_rect = e.target.getBoundingClientRect();
    var x = e.clientX - target_rect.left;
    var y = e.clientY - target_rect.top;
    //console.log("x" + x, "y" + y);

    /* 描画モードの時 */
    if (drawing) {
        /* スマホ、タブレット以外 */
        if (typeof e.touches == 'undefined') {
            ctx.lineTo(x, y);
            /* スマホ、タブレット */
        } else {
            var t = e.touches[0];
            /* 描画位置のズレを修正 */
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
};
/* マウス移動時 */
canvas.onmousemove = wLine;
/* タッチ移動時 */
canvas.ontouchmove = wLine;

/*描画の開始*/
var wStart = (e) => {
    /* スマホで画面がずれないように */
    e.preventDefault();
    /* 描画モードに */
    drawing = true;
    ctx.beginPath();

    var target_rect = e.target.getBoundingClientRect();
    var x = e.clientX - target_rect.left;
    var y = e.clientY - target_rect.top;
    //console.log("x" + x, "y" + y);

    /* スマホ、タブレット以外 */
    if (typeof e.touches == 'undefined') {
        ctx.moveTo(x, y);

        /* スマホ、タブレット */
    } else {
        var t = e.touches[0];
        /* 描画位置のズレを修正 */
        ctx.moveTo(x, y);
    }
};
/* マウス押下時 */
canvas.onmousedown = wStart;
/* タッチ開始時 */
canvas.ontouchstart = wStart;

/* クリアボタン押下時 */
clear.onclick = () => {
    ctx.clearRect(0, 0, wW, wH);
    getWindowSize();
    setBgColor();
};

/* 選択を未選択状態に */
var clearCs = (cs, def) => {
    for (let i = 0; i < cs.length; i++) {
        cs[i].setAttribute('class', def);
    }
};

/* 線の太さ入力欄に変更があった時	 */
num_wds.onchange = () => {
    clearCs(wds, 'wds');
    ctx.lineWidth = num_wds.value;
    wds[num_wds.value - 1].setAttribute('class', 'wds cur');

};
/* 線選択枠のクリックイベントの登録 */
for (let i = 0; i < wds.length; i++) {
    wds[i].onclick = () => {
        /* 線の太さ入力欄の選択状態を解除 */
        clearCs(wds, 'wds');
        ctx.lineWidth = wds[i].getAttribute('wd');
        num_wds.setAttribute('value', `${i + 1}`);
        wds[i].setAttribute('class', 'wds cur');
    };
}

/* 色ウィンドウから選択された時 */
num_cls.onchange = () => {
    /* 選択した色を保存するボタン */
    //var p10 = c10.parentNode;
    clearCs(cls, 'cls');
    ctx.strokeStyle = num_cls.value;
    save_c10.style.background = num_cls.value;
    save_c10.setAttribute('cl', num_cls.value);
    save_c11.setAttribute('class', 'cls cur');
};
/* 色選択枠のクリックイベントの登録 */
for (let i = 0; i < cls.length; i++) {
    cls[i].onclick = () => {
        clearCs(cls, 'cls');
        ctx.strokeStyle = cls[i].getAttribute('cl');
        cls[i].setAttribute('class', 'cls cur');
    }
}

/* 保存ボタン押下時 */
save.onclick = () => {
    var data = canvas.toDataURL("image/jpeg");
    save.href = data;
    /* 画像のURL表現からデータ部を取出、Base64デコード
    var data = atob(ctx.toDataURL().replace(/^[^,]*,/, '')),
        // Bufferデータ配列に変換 
        bf = Uint8Array.from(data.split(''), x => x.charCodeAt(0));
    var blob = new Blob([bf], {
            type: 'image/png'
        }),
        e = d.createEvent('MouseEvents'),
        a = d.createElement('a');
    //クリックイベントを作成 
    e.initMouseEvent('click', false, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    //ダウンロードデータをリンク先に設定
    a.href = URL.createObjectURL(blob);
    a.download = 'paint.png';
    //ダウンロードリンクのイベントを発火
    a.dispatchEvent(e); */
};