import Client from './client';

import './style.css';

const game = new Client();

window.addEventListener("resize", () => game.resize(window.innerWidth, window.innerHeight))
game.resize(window.innerWidth, window.innerHeight)

const container = document.querySelector("#app")
if (!container) throw new Error("Could not get container")

game.appendCanvas(container)

game.run()