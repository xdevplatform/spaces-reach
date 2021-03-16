class BigNumber extends Emitter {
  constructor(element) {
    super(element);
    this.title = element.querySelector('h2');
    this.number = element.querySelector('h1');
    this.trend = element.querySelector('h4');
    this.chart = this.childNodes()[0].instance;
  }
  
  update() {
    this.setState({refresh: new Date().getTime()});
  }
  
  render() {
    console.log(this.component.dataset)
    this.title.innerText = this.component.dataset.name;
    this.number.innerText = new Intl.NumberFormat().format(this.component.dataset.volume);
    this.chart.update(JSON.parse(this.component.dataset.results));
  }
}