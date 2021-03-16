class Chart extends Emitter {
  constructor(element) {
    super(element);
  }
  
  render() {
    try {
      const data = JSON.parse(this.component.dataset.data);
      console.log(data);
    } catch(e) {
      return;
    }
  }
}