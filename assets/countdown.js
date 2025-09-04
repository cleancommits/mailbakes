function countdown() {
  document.querySelectorAll('.announcement-bar__countdown').forEach(bar => {
    const weekdayHour = 12;
    const weekendHour = 8;
    const now = new Date();
    const day = now.getDay();
    const toReplaceWith = `<span class="timer-${bar.dataset.block} timer"></span>`;
    let text = ''
    let dateTimeUntil;
    oncePerSecondAnim(() => {
      if (day >= 1 && day <= 4) { // MONDAY-THURSDAY behaviour
        if (now.getHours() < 12) {
          text = bar.dataset.message1.toString();
          dateTimeUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate(), weekdayHour, 0, 0, 0);
        } else {
          text = bar.dataset.message2.toString()
          let tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          dateTimeUntil = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), weekdayHour, 0, 0, 0);
        }
      } else if (day == 5) { // FRIDAY behaviour
        if (now.getHours() < 12) {
          text = bar.dataset.message1.toString();
          dateTimeUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate(), weekdayHour, 0, 0, 0);
        } else {
          text = bar.dataset.message2.toString()
          let tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          dateTimeUntil = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), weekendHour, 0, 0, 0);
        }
      } else if (day == 6) { // SATURDAY behaviour
        if (now.getHours() < 8) {
          text = bar.dataset.message1.toString();
          dateTimeUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate(), weekendHour, 0, 0, 0);
        }
      } else if (day == 0) { // SUNDAY behaviour
        if (now.getHours() >= 12) {
          text = bar.dataset.message2.toString();
          let tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          dateTimeUntil = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), weekdayHour, 0, 0, 0);
        }
      }
      bar.innerHTML = `<span>${text.replace('~', toReplaceWith)}</span>`;
      document.querySelector(`span.timer-${bar.dataset.block}`).innerHTML = getTimeUntil(dateTimeUntil);
    });
  });

  document.querySelectorAll('.announcement-bar__no-countdown').forEach(bar => {
    const day = new Date().getDay();
    if (day == 6 && bar.dataset.message1) {
      bar.innerHTML = `<span>${bar.dataset.message1}</span>`;
    }
    if (day == 0 && bar.dataset.message2) {
      bar.innerHTML = `<span>${bar.dataset.message2}</span>`;
    }
  })
}

function getTimeUntil(dateTimeUntil) {
  const now = new Date();
  const then = new Date(dateTimeUntil);
  const diff = then - now;

  return `${new Date(diff).toISOString().slice(11, 19).replace(':','h ').replace(':','m ').replace('00h','').replace(/0(?=.h)/, '').replace(/0(?=.m)/, '')}s`;
}

function oncePerSecondAnim(callback) {
  var frameFunc = function () {
    var now = 1000 * Math.floor(Date.now() / 1000 + 0.1);
    callback(now);
    setTimeout(timerFunc, now + 1000 - Date.now());
  }, timerFunc = function () {
    requestAnimationFrame(frameFunc);
  };
  timerFunc();
}

countdown();
