async function sleep(message, ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(message);
      resolve();
    }, ms);
  });
}
async function wait10Second(message) {
  await sleep(message, 10000);
}
async function wait3Second(message) {
  await sleep(message, 3000);
}

module.exports = { wait10Second, wait3Second };
