class Chart extends Emitter {
  constructor(element) {
    super(element);
  }
  
  render() {
    try {
      const data = JSON.parse(this.component.dataset.data);
      const max = Math.max(...data.map(data => data.count));
      data.map
    } catch(e) {
      return;
    }
  }
}