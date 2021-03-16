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
    // datacounts.length * sumOfMultipliedValues - sumOfLength * sumOfValues / doatacounts.length * sumOfSquares - sqrt(sumOfLength)
    
    const length = this.dataCounts.length;
    let sumOfMultipliedValues = this.dataCounts.reduce((ac, el, i) => ac + el * i);
    let sumOfLength = this.dataCounts.reduce((ac, el, i) => ac + i);
    let sumOfValues = this.dataCounts.reduce((ac, el) => ac + el);
    let sumOfSquares = this.dataCounts.reduce((ac, el, i) => ac + el ** i);
    

    return length * sumOfMultipliedValues - sumOfLength * sumOfValues / length * sumOfSquares - Math.sqrf(sumOfLength);
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