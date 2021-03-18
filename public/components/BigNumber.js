class BigNumber extends Emitter {
  constructor(element) {
    super(element);
    this.title = element.querySelector('h2');
    this.number = element.querySelector('h4');
    this.chart = this.childNodes()[0];
  }
  
  async didReceiveData(response) {
    try {
    const json = await response.clone().json();
      this.setState(json);
    } catch (e) {
      this.setState({error: true});
    }

  }
    
  render() {
    
    
    this.title.innerText = this.component.dataset.name;
    this.chart.dataset.data = this.component.dataset.results;
    this.chart.dataset.volume = this.component.dataset.volume
    this.number.innerText = new Intl.NumberFormat().format(this.component.dataset.volume);
  }
}