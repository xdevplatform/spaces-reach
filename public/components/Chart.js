class Chart extends Emitter {
  constructor(element) {
    super(element);
    console.log(this.props);
    this.render();
  }
  render() {console.log('render', this.props)}
}