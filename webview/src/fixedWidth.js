import { $ } from './util.js';

export default function () {
  const w = document.getElementById('window')

  const span = document.getElementById("fw-span");

  w.onclick = function () {
    // span.innerHTML = w.getboundingclientrect().width + "px"
    span.innerHTML = "100px"
  }
}