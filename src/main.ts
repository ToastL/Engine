import GameScene from './client';
import { ToastEngine } from './engine';

import './style.css';

const engine = new ToastEngine();

const test = new GameScene(engine)
engine.scene = test

window.addEventListener('resize', () => engine.resize(window.innerWidth, window.innerHeight))
window.addEventListener('keydown', e => engine.keyDown(e.key))
window.addEventListener('keyup', e => engine.keyUp(e.key))
engine.resize(window.innerWidth, window.innerHeight)

const container = document.querySelector('#app')
if (!container) throw new Error('Could not get container')

engine.appendCanvas(container)

engine.run()