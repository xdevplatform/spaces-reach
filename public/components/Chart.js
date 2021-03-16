class Chart extends Emitter {
  constructor(element) {
    super(element);
  }
  
  render() {
    try {
      this.component.innerHTML = '';
      const data = JSON.parse(this.component.dataset.data);
      const dataCounts = data.map(data => data.count);
      const max = Math.max(...dataCounts);
      dataCounts.map(count => {
        const histogram = document.createElement('div');
        const height = (count / max) * 100;
        histogram.style.height = height.toFixed(2) + '%';
        this.component.appendChild(histogram);
      });
    } catch(e) {
      return;
    }
  }
}