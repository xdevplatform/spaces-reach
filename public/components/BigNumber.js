class BigNumber extends Emitter {
  constructor(element) {
    super(element);
    this.title = element.querySelector('h2');
    this.number = element.querySelector('h1');
    this.trend = element.querySelector('h4');
    this.chart = this.childNodes()[0];
  }
    
  update() {
    this.setState({refresh: new Date().getTime()});
  }
  
  render() {
    this.title.innerText = this.component.dataset.name;
    this.chart.dataset.data = this.component.dataset.results;
    this.number.innerText = new Intl.NumberFormat().format(this.component.dataset.volume);
  }
}