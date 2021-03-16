class Chart extends Emitter {
  constructor(element) {
    super(element)
  }
  render() {console.log('render')}
  update(data) {console.log(data)}
}