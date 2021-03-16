class BigNumber extends Emitter {
  constructor(element) {
    super(element);
    this.title = element.querySelector('h2');
    this.number = element.querySelector('h1');
    this.trend = element.querySelector('h4');
  }
  
  update() {
    this.setState({refresh: new Date().getTime()});
  }
  
  render() {
    this.title.innerText = this.component.dataset.name;
    this.number.innerText = new Intl.NumberFormat().format(this.component.dataset.volume);
    this.childNodes()[0].instance.update(JSON.parse(this.component.dataset.results));
  }
}