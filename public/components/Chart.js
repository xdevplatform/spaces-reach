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
      this.volume = +this.component.dataset.volume;
      this.dataCounts = this.data.map(data => data.count);
      return true;  
    } catch (e) {
      return false;
    }
  }
  
  showDetail(e) {
    if (!e.target.classList.contains('histogram')) {
      return;
    }
    
    if (e.target.classList.contains('selected')) {
      e.target.classList.remove('selected');
      this.parent.component.dataset.volume = this.volume;
      return;
    }
    
    e.target.classList.add('selected');
    this.parent.component.dataset.volume = e.target.dataset.title;
  }
  
  determineTrend() {   
    const length = this.dataCounts.length;
    let sumOfLength = this.dataCounts.reduce((ac, el, i) => ac + i, 0);
    let sumOfMultipliedValues = this.dataCounts.reduce((ac, el, i) => ac + el * i);
    let sumOfValues = this.volume;
    let sumOfSquares = this.dataCounts.reduce((ac, el, i) => ac + el ** 2);
        
    return (length * sumOfMultipliedValues - sumOfLength * sumOfValues) / (length * sumOfSquares - Math.sqrt(sumOfLength));
  }
  
  didUpdateDataset(data) {
    try {
      this.data = JSON.parse(this.component.dataset.data);
      this.setState({ data: this.data });
    } catch (e) {}
  }
  
  render() {
    const dateFormatter = new Intl.DateTimeFormat('default', {month: 'short', day: 'numeric'});
    const numberFormatter = new Intl.NumberFormat();
    this.component.innerHTML = '';
    const max = Math.max(...this.dataCounts);
    this.dataCounts.map((count, i) => {
      const histogram = document.createElement('div');
      histogram.classList.add('histogram');
      const height = (count / max) * 100;
      histogram.style.height = height === 0 ? '1px' : height.toFixed(2) + '%';
      let dateParts = this.data[i].timePeriod.match(/(\d{4})(\d{2})(\d{2})/).splice(1,3);
      dateParts[1] -= 1;
      dateParts = dateParts.concat([0, 0, 0, 0]);
      const date = new Date(Date.UTC(...dateParts));
      histogram.dataset.title = `${dateFormatter.format(date)}: ${numberFormatter.format(count)}`;
      this.component.appendChild(histogram);
    });
    
    const trend = this.determineTrend();
    if (trend < 0) {
      this.component.classList.add('down');
    } else if (trend > 0) {
      this.component.classList.add('up');
    }
  }
}