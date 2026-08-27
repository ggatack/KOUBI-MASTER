
let winScore = 30;

const winButtons = document.querySelectorAll(".win-options button");

winButtons.forEach(button => {
    button.addEventListener("click", () => {

        winButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        winScore = Number(button.textContent);

    });
});


document.querySelector(".start").addEventListener("click", () => {

    let players = [
        document.getElementById("player1").value,
        document.getElementById("player2").value,
        document.getElementById("player3").value,
        document.getElementById("player4").value
    ];


    if(players.some(player => player.trim() === "")) {
        alert("أدخل أسماء جميع اللاعبين");
        return;
    }


    let game = {
        players: players,
        scores: [0,0,0,0],
        winScore: winScore,
        round: 1
    };


    localStorage.setItem(
        "koubiGame",
        JSON.stringify(game)
    );


    document.querySelector(".setup").style.display = "none";
document.getElementById("gameScreen").style.display = "block";

let area = document.getElementById("playersArea");

players.forEach((player)=>{

    area.innerHTML += `
    
    <div class="player-card">

        <h3>${player}</h3>

        <p>النقاط: 0</p>

        <label>الطلب:</label>

        <select>
            <option>0</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
            <option>6</option>
            <option>7</option>
            <option>8</option>
            <option>9</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
            <option>13</option>
        </select>

        <label>المنجز:</label>

        <input type="number" min="0" max="13">

    </div>

    `;


});
});
alert("وصل لكود الإنهاء");
document.querySelector(".nextRound").addEventListener("click", ()=>{

    let cards = document.querySelectorAll(".player-card");

    cards.forEach((card,index)=>{

        let request = Number(card.querySelector("select").value);
        let done = Number(card.querySelector("input").value);

        let points = 0;

        if(request === 0){

            if(done === 0){
                points = 5;
            } else {
                points = -5;
            }

        } else {

            if(done >= request){
                points = request;
            } else {
                points = -request;
            }

        }

        game.scores[index] += points;

    });


    localStorage.setItem(
        "koubiGame",
        JSON.stringify(game)
    );

    alert("تم حساب الجولة ♠️");

});
