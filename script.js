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


    alert("تم إنشاء اللعبة ♠️");

});
