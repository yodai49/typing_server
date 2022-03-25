function processKeypress(myKey,myKeyCode,e){ //キー入力イベント　シーン→キー→条件の順番で分ける

}  

window.addEventListener('load', init); //ロードイベント登録
window.addEventListener('mousemove',function(e){ //マウスが動いた時に座標をセット
    mouseX=e.clientX-document.getElementById("myCanvas").getBoundingClientRect().left;
    mouseY=e.clientY-document.getElementById("myCanvas").getBoundingClientRect().top;
})
window.addEventListener('click',function(e){//クリックされた時に座標をセット
    clickX=mouseX;
    clickY=mouseY;
})
window.addEventListener('DOMContentLoaded', function(){ ///キー入力イベント登録
    window.addEventListener("keydown", function(e){
        if(e.keyCode==32) e.preventDefault();
        processKeypress(e.key,e.keyCode,e);
    });
});
function drawMouseCursor(){ //マウスカーソルを描画する関数
    ctx2d.beginPath();
    ctx2d.lineWidth=3;
    ctx2d.arc(mouseX,mouseY,10,0,Math.PI*2);
    ctx2d.stroke();
    ctx2d.fill();
}
function processMouseEvent(){

}

function checkLoaded(){
    if(imgLoadedCnt==IMG_CNT){
        imgLoadedCnt=-1;
        sceneAni=performance.now();//ロード完了後にこれを実行
        nextScene=1;
        if(DEBUG_MODE) nextScene=DEBUG_MODE;
    }
}
function changeScene(prev,next){

}
function init() {
    //ローディング処理////////////////////////////////////////
    if(DEBUG_MODE) loadData();
    tick();

    function tick() {
        t=performance.now();
        if(sceneAni==0 && imgLoadedCnt!=-1) checkLoaded();

        //2次元のリセット処理
        if(scene) ctx2d.clearRect(0,0,WIDTH,HEIGHT),ctx2d.clearRect(0,0,WIDTH,HEIGHT);

        if(scene==1){ //タイトル画面

        } 

        /////////////////全シーン共通処理
        drawMouseCursor();
        processMouseEvent();
        if(clickX && clickY) processClick();
        ///////////////
        if(sceneAni){
            if(nextScene!=scene){
                ctx2d.fillStyle="rgba(0,0,0," + (t-sceneAni)/(SCENE_ANI * (1+1*(scene==1 || scene==0|| nextScene == 3)))+")";
                ctx2d.fillRect(0,0,WIDTH,HEIGHT);
                if(t-sceneAni > SCENE_ANI * (1+1*(scene==1 || scene==0 || nextScene == 3))) scene=nextScene,sceneAni=t,changeScene(scene,nextScene);
            } else{
                ctx2d.fillStyle="rgba(0,0,0," + (1-(t-sceneAni)/SCENE_ANI)+")";
                ctx2d.fillRect(0,0,WIDTH,HEIGHT);
                if(t-sceneAni > SCENE_ANI) sceneAni=0;
            }
        }
        requestAnimationFrame(tick);
    }
}