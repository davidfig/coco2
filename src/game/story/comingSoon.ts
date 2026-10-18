/** The magazine's six bands, as on its masthead (`BAND` in magazine/paper.ts). */
const BANDS = ['#d93a2b', '#f08a24', '#f4c61c', '#3b9c47', '#2c68b8', '#7b3f9d'];

/**
 * Placeholder for issue 2. Once issue 1's night has passed (`issue2-waiting`), this card says the May RAINBOW is on its
 * way. Close it with ×; it comes back on the next load until issue 2 replaces it.
 */
export class ComingSoon {
  private readonly el = document.createElement('div');
  private closed = false;

  constructor() {
    this.el.className = 'coming-soon';
    const stripe = document.createElement('div');
    stripe.className = 'coming-soon-stripe';
    for (const c of BANDS) {
      const band = document.createElement('span');
      band.style.background = c;
      stripe.append(band);
    }
    const title = document.createElement('div');
    title.className = 'coming-soon-title';
    title.innerHTML = '<i>the</i> RAINBOW';
    const date = document.createElement('div');
    date.className = 'coming-soon-date';
    date.textContent = 'May 1986';
    const text = document.createElement('div');
    text.className = 'coming-soon-text';
    text.textContent = 'The next issue, and its tape, are coming soon.';
    const close = document.createElement('button');
    close.className = 'coming-soon-close';
    close.textContent = '×';
    close.title = 'Close';
    close.addEventListener('click', () => {
      this.closed = true;
      this.el.classList.remove('show');
    });
    this.el.append(close, stripe, title, date, text);
    document.body.append(this.el);
  }

  /** Show the card while issue 2 is awaited (and the player has not closed it this session). */
  update(waiting: boolean): void {
    this.el.classList.toggle('show', waiting && !this.closed);
  }
}
