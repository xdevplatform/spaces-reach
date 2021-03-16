class Chart extends Emitter {
  constructor(element) {
    super(element);
  }
    
  willRender() {
    if (this.dataCounts) {
      return true;
    }
    
    try {
      this.data = JSON.parse(this.component.dataset.data);
      this.dataCounts = this.data.map(data => data.count);
      return true;  
    } catch (e) {
      return false;
    }
    
  }
  
  determineTrend() {   
    const length = this.dataCounts.length;
    let sumOfMultipliedValues = this.dataCounts.reduce((ac, el, i) => ac + el * i);
    let sumOfLength = this.dataCounts.reduce((ac, el, i) => ac + i);
    let sumOfValues = this.dataCounts.reduce((ac, el) => ac + el);
    let sumOfSquares = this.dataCounts.reduce((ac, el, i) => ac + el ** i);
    
    return length * sumOfMultipliedValues - sumOfLength * sumOfValues / length * sumOfSquares - Math.sqrt(sumOfLength);
  }
  
  render() {
    const formatter = new Intl.DateTimeFormat();
    this.component.innerHTML = '';
    const max = Math.max(...this.dataCounts);
    this.dataCounts.map(count => {
      const histogram = document.createElement('div');
      const height = (count / max) * 100;
      histogram.style.height = height === 0 ? '1px' : height.toFixed(2) + '%';
      this.component.appendChild(histogram);
    });
    
    const trend = this.determineTrend();
    console.log(trend);
    if (trend < 0) {
      this.component.classList.add('down');
    } else if (trend > 0) {
      this.component.classList.add('up');
    }
  }
}