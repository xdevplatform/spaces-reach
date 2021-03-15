class TrendsContainer extends Emitter {
  constructor(element) {
    super(element);
    
    Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery.map(query => await Emitter.emit(fetch('/counts')))
  }
  render() {}
}