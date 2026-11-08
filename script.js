(() => {
"use strict";
const STORAGE_KEY = "koubiGame";
const TARGETS = [25, 30, 50];
const $ = (selector) => document.querySelector(selector);
let selectedTarget = 30;
let game = null;
const setupScreen = $("#setupScreen");
const gameScreen = $("#gameScreen");
const resultScreen = $("#resultScreen");
const setupMessage = $("#setupMessage");
const roundMessage = $("#roundMessage");

function saveGame() {
    if (game) localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}
function loadGame() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.players) || parsed.players.length !== 4) return null;
        if (!Array.isArray(parsed.history)) parsed.history = [];
        if (!Number.isInteger(parsed.round) || parsed.round < 1) parsed.round = parsed.history.length + 1;
        if (!TARGETS.includes(Number(parsed.winScore))) parsed.winScore = 30;
        parsed.players = parsed.players.map((player) => ({
            name: String(player.name || "لاعب").slice(0, 24),
            score: Number.isFinite(Number(player.score)) ? Number(player.score) : 0,
            lastBidZero: typeof player.lastBidZero === "boolean" ? player.lastBidZero : Boolean(parsed.history.length && parsed.history[parsed.history.length - 1].results?.find((r) => r.name === player.name)?.bid === 0)
        }));
        parsed.finished = Boolean(parsed.finished);
        return parsed;
    } catch (error) {
        console.error("تعذر تحميل المباراة المحفوظة:", error);
        return null;
    }
}
function showScreen(screen) {
    setupScreen.hidden = screen !== "setup";
    gameScreen.hidden = screen !== "game";
    resultScreen.hidden = screen !== "result";
}
function startNewGame() {
    const names = [1, 2, 3, 4].map((number) => $("#player" + number).value.trim());
    if (names.some((name) => !name)) {
        setupMessage.textContent = "اكتب أسماء اللاعبين الأربعة أولاً.";
        return;
    }
    game = {
        players: names.map((name) => ({ name: name, score: 0 })),
        winScore: selectedTarget, round: 1, history: [], finished: false
    };
    saveGame();
    renderGame();
    showScreen("game");
}
function getMinimumBid(score) {
    if (score >= 16) return 4;
    if (score >= 12) return 3;
    return 0;
}
function addOption(select, value, label) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = label;
    select.append(option);
}
function renderScoreboard() {
    const container = $("#scoreboardList");
    container.replaceChildren();
    const sorted = game.players.map((player, index) => ({ name: player.name, score: player.score, index: index }))
        .sort((a, b) => b.score - a.score);
    sorted.forEach((player, position) => {
        const row = document.createElement("div");
        row.className = "score-row";
        const rank = document.createElement("span"); rank.className = "rank"; rank.textContent = "#" + (position + 1);
        const name = document.createElement("span"); name.className = "score-name"; name.textContent = player.name;
        const score = document.createElement("strong"); score.className = "score-value"; score.textContent = player.score;
        row.append(rank, name, score); container.append(row);
    });
}
function renderPlayers() {
    const area = $("#playersArea");
    area.replaceChildren();
    game.players.forEach((player, index) => {
        const card = document.createElement("article"); card.className = "player-card";
        const heading = document.createElement("div"); heading.className = "player-heading";
        const name = document.createElement("h4"); name.textContent = player.name;
        const score = document.createElement("span"); score.className = "current-score"; score.textContent = player.score + " نقطة";
        heading.append(name, score);
        const bidLabel = document.createElement("label"); bidLabel.htmlFor = "bid-" + index; bidLabel.textContent = "الطلب";
        const bid = document.createElement("select"); bid.id = "bid-" + index;
        const minBid = getMinimumBid(player.score);
        if (minBid === 0) addOption(bid, 0, "0");
        for (let value = Math.max(2, minBid); value <= 13; value++) addOption(bid, value, String(value));
        const doneLabel = document.createElement("label"); doneLabel.htmlFor = "done-" + index; doneLabel.textContent = "المنجز";
        const done = document.createElement("input"); done.id = "done-" + index; done.type = "number";
        done.min = "0"; done.max = "13"; done.step = "1"; done.inputMode = "numeric"; done.placeholder = "0 - 13";
        const rule = document.createElement("small"); rule.className = "rule-note";
        rule.textContent = minBid >= 4 ? "رصيدك 16 أو أكثر: أقل طلب 4." :
            minBid >= 3 ? "رصيدك 12 أو أكثر: أقل طلب 3." : "يمكنك اختيار صفر أو من 2 إلى 13.";
        if (player.lastBidZero) rule.textContent += " طلبت صفر في الجولة السابقة؛ لا يمكنك طلبه الآن.";
        card.append(heading, bidLabel, bid, doneLabel, done, rule); area.append(card);
    });
}
function renderHistory() {
    const container = $("#historyList"); container.replaceChildren();
    if (!game.history.length) {
        const empty = document.createElement("p"); empty.className = "empty";
        empty.textContent = "لم تُلعب أي جولة بعد."; container.append(empty); return;
    }
    [...game.history].reverse().forEach((round) => {
        const block = document.createElement("div"); block.className = "history-round";
        const title = document.createElement("strong"); title.textContent = "الجولة " + round.number; block.append(title);
        round.results.forEach((result) => {
            const line = document.createElement("p");
            line.textContent = result.name + ": طلب " + result.bid + "، أنجز " + result.done + "، " +
                (result.points > 0 ? "+" : "") + result.points;
            block.append(line);
        });
        container.append(block);
    });
}
function renderGame() {
    $("#roundNumber").textContent = game.round;
    $("#targetScore").textContent = game.winScore;
    renderScoreboard(); renderPlayers(); renderHistory();
    $("#undoRound").disabled = game.history.length === 0;
    roundMessage.textContent = "";
}
function finishRound() {
    if (!game || game.finished) return;
    const entries = game.players.map((player, index) => {
        const bid = Number($("#bid-" + index).value);
        const doneInput = $("#done-" + index);
        const doneText = doneInput.value.trim();
        const done = Number(doneText);
        const minimum = getMinimumBid(player.score);
        if (doneText === "" || !Number.isInteger(done) || done < 0 || done > 13)
            return { error: "أدخل عدد اللمات من 0 إلى 13 للاعب " + player.name + "." };
        if (!Number.isInteger(bid) || bid < 0 || bid > 13 || bid === 1)
            return { error: "طلب غير صحيح للاعب " + player.name + "." };
        if (bid < minimum || (minimum > 0 && bid === 0))
            return { error: "طلب " + player.name + " يجب أن يكون " + minimum + " أو أكثر." };
        if (bid === 0 && player.lastBidZero)
            return { error: player.name + " لا يمكنه طلب صفر في جولتين متتاليتين." };
        return { name: player.name, bid: bid, done: done, index: index, previousScore: player.score, previousLastBidZero: player.lastBidZero };
    });
    const invalid = entries.find((entry) => entry.error);
    if (invalid) { roundMessage.textContent = invalid.error; return; }
    const totalDone = entries.reduce((sum, entry) => sum + entry.done, 0);
    if (totalDone !== 13) { roundMessage.textContent = "مجموع اللمات المنجزة يجب أن يساوي 13. المجموع الحالي: " + totalDone + "."; return; }
    const results = entries.map((entry) => {
        let points;
        if (entry.bid === 0) points = entry.done === 0 ? 5 : -5;
        else points = entry.done >= entry.bid ? (entry.bid >= 7 ? entry.bid * 2 : entry.bid) : -entry.bid;
        game.players[entry.index].score += points;
        game.players[entry.index].lastBidZero = entry.bid === 0;
        return { name: entry.name, bid: entry.bid, done: entry.done, points: points,
            previousScore: entry.previousScore, previousLastBidZero: entry.previousLastBidZero };
    });
    game.history.push({ number: game.round, results: results });
    game.round += 1;
    const qualified = game.players.filter((player) => player.score >= game.winScore);
    if (qualified.length) {
        const highest = Math.max(...qualified.map((player) => player.score));
        game.winners = qualified.filter((player) => player.score === highest).map((player) => player.name);
        game.finished = true; saveGame(); renderScoreboard(); renderHistory(); showResult(); return;
    }
    saveGame(); renderGame();
}
function undoLastRound() {
    if (!game || game.finished || !game.history.length) return;
    if (!window.confirm("هل تريد التراجع عن آخر جولة؟ سيتم استرجاع النقاط والطلبات السابقة.")) return;
    const lastRound = game.history.pop();
    lastRound.results.forEach((result, index) => {
        const player = game.players.find((item) => item.name === result.name);
        if (!player) return;
        if (Number.isFinite(result.previousScore)) player.score = result.previousScore;
        else player.score -= result.points;
        if (typeof result.previousLastBidZero === "boolean") player.lastBidZero = result.previousLastBidZero;
        else {
            const previous = [...game.history].reverse().flatMap((round) => round.results).find((item) => item.name === result.name);
            player.lastBidZero = Boolean(previous && previous.bid === 0);
        }
    });
    game.round = Math.max(1, lastRound.number);
    game.finished = false;
    delete game.winners;
    saveGame(); renderGame(); showScreen("game");
}
function showResult() {
    const winners = game.winners || [];
    $("#resultTitle").textContent = winners.length > 1 ? "تعادل في الصدارة!" : "الفائز بالكوبي!";
    $("#resultText").textContent = winners.length ? winners.join(" و ") + " وصلوا إلى حد الفوز أو تجاوزوه." : "انتهت المباراة.";
    const scores = $("#finalScores"); scores.replaceChildren();
    [...game.players].sort((a, b) => b.score - a.score).forEach((player) => {
        const line = document.createElement("p"); line.textContent = player.name + ": " + player.score + " نقطة"; scores.append(line);
    });
    showScreen("result");
}
function resetToSetup() {
    if (game && game.history.length && !game.finished) {
        if (!window.confirm("هل تريد إنهاء المباراة الحالية والبدء من جديد؟ ستُحذف المباراة المحفوظة.")) return;
    }
    localStorage.removeItem(STORAGE_KEY); game = null;
    [1, 2, 3, 4].forEach((number) => { $("#player" + number).value = ""; });
    showScreen("setup");
}
document.querySelectorAll(".win-options button").forEach((button) => {
    button.addEventListener("click", () => {
        selectedTarget = Number(button.dataset.score);
        document.querySelectorAll(".win-options button").forEach((item) => item.classList.toggle("active", item === button));
    });
});
$("#startGame").addEventListener("click", startNewGame);
$("#finishRound").addEventListener("click", finishRound);
$("#undoRound").addEventListener("click", undoLastRound);
$("#newGame").addEventListener("click", resetToSetup);
$("#playAgain").addEventListener("click", resetToSetup);
game = loadGame();
if (game) {
    if (game.finished) showResult();
    else { selectedTarget = game.winScore; renderGame(); showScreen("game"); }
} else showScreen("setup");
})();