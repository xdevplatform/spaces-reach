class Chart extends Emitter {
  constructor(element) {
    super(element);
    if (this.component.dataset.data) {
      const data = JSON.parse(this.component.dataset.data);
      this.dataCounts = data.map(data => data.count);      
    }
  }
  
  willRender() {
    return this.dataCounts;
  }
  
  determineTrend() {
    // datacounts.length * sum 
  }
  
  render() {
    try {
      this.component.innerHTML = '';
      const max = Math.max(...this.dataCounts);
      this.dataCounts.map(count => {
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