function setup() {
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let clickCount = 0;
  let matchedPairs = 0;
  let totalPairs = 3;
  let timeLeft = 30;
  let timerInterval;
  let matchStreak = 0;


  function handleCardClick() {
    // prevent flipping if the card is already flipped
    if (lockBoard || $(this).hasClass("flip")) return;

    clickCount++;
    updateStatus();

    // flip the card
    $(this).addClass("flip");

    // check the first and second card clicked
    if (!firstCard) {
      firstCard = $(this);
    } else {
      secondCard = $(this);
      if (firstCard.is(secondCard)) return;

      lockBoard = true;

      const firstImg = firstCard.find(".front_face")[0];
      const secondImg = secondCard.find(".front_face")[0];

      if (firstImg.src === secondImg.src) {
        matchStreak++;

        // power-up after 2 matches in a row
        if (matchStreak === 2) {
          timeLeft += 3;
          $("#time-remaining").text(`Time: ${timeLeft}s`);
          $("#message")
            .removeClass("d-none alert-danger alert-success")
            .addClass("alert-info")
            .text("⚡ Power-Up! +3 seconds!");

          setTimeout(() => {
            $("#message").addClass("d-none").removeClass("alert-info").text("");
          }, 2000);

          matchStreak = 0;
        }

        firstCard.off("click");
        secondCard.off("click");
        matchedPairs++;
        updateStatus();

        if (matchedPairs === totalPairs) {
          clearInterval(timerInterval);
          $("#message").removeClass("d-none alert-danger").addClass("alert-success").text("🎉 You Win!");
          $(".card").off("click");
        }

        resetBoardState();
      } else {
        setTimeout(() => {
          firstCard.removeClass("flip");
          secondCard.removeClass("flip");
          resetBoardState();
          matchStreak = 0;
        }, 1000);
      }
    }
  }

  function resetBoardState() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
  }

  function updateStatus() {
    // Status update logic
    $("#click-count").text(`Clicks: ${clickCount}`);
    $("#pairs-matched").text(`Matched: ${matchedPairs}`);
    $("#pairs-left").text(`Left: ${totalPairs - matchedPairs}`);
    $("#total-pairs").text(`Total Pairs: ${totalPairs}`);
  }

  function startTimer() {
    clearInterval(timerInterval);
    $("#time-remaining").text(`Time: ${timeLeft}s`);

    timerInterval = setInterval(() => {
      timeLeft--;
      $("#time-remaining").text(`Time: ${timeLeft}s`);

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        $("#message").removeClass("d-none alert-success").addClass("alert-danger").text("⏰ Game Over!");
        $(".card").off("click");
      }
    }, 1000);
  }

  async function fetchAndLoadCards(pairCount) {
    const offset = Math.floor(Math.random() * 1000);
    const limit = pairCount * 2;
    // Fetch pokemon data from the API

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    const data = await res.json();

    let images = [];

    for (let pokemon of data.results) {
      try {
        const pokeRes = await fetch(pokemon.url);
        const details = await pokeRes.json();
        const img = details.sprites.other["official-artwork"].front_default;
        if (img) images.push(img);
        if (images.length === pairCount) break;
      } catch (err) {
        console.error("Error fetching Pokémon:", err);
      }
    }

    const imagePool = [...images, ...images].sort(() => 0.5 - Math.random());

    const gameGrid = $("#game_grid");
    gameGrid.empty();

    imagePool.forEach(src => {
      const card = $(`
        <div class="card">
          <img class="front_face" src="${src}" alt="front">
          <img class="back_face" src="back.webp" alt="back">
        </div>
      `);
      gameGrid.append(card);
    });

    $(".card").on("click", handleCardClick);
  }

  async function resetGame() {
    clearInterval(timerInterval);

    const difficulty = $("#difficulty").val();
    const gameGrid = $("#game_grid");

    gameGrid.removeClass("easy medium hard").addClass(difficulty);

    if (difficulty === "easy") {
      totalPairs = 3;
      timeLeft = 30;
    } else if (difficulty === "medium") {
      totalPairs = 6;
      timeLeft = 45;
    } else {
      totalPairs = 9;
      timeLeft = 60;
    }

    clickCount = 0;
    matchedPairs = 0;
    matchStreak = 0;
    firstCard = null;
    secondCard = null;
    lockBoard = false;

    $("#message").addClass("d-none").removeClass("alert-danger alert-success alert-info").text("");
    updateStatus();
    $("#time-remaining").text(`Time: ${timeLeft}s`);

    await fetchAndLoadCards(totalPairs);
  }

  // buttons logic
  $("#themeToggle").on("change", function () {
    $("#game_grid").toggleClass("dark");
  });

  $("#start-btn").on("click", async function () {
    await resetGame();
    startTimer();
  });

  $("#reset-btn").on("click", async function () {
    await resetGame();
  });
}

$(document).ready(setup);
