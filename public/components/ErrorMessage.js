class ErrorMessage extends Emitter {
  constructor(component) {
    super(component);
    this.button = this.component.querySelector('button');
  }

  dismiss(event) {
    if (event.target === this.button) {
      this.setState({show: false});
    }
  }

  getInitialState() {
    return {show: false};
  }

  async didReceiveData(data) {
    if (data.ok) {
      this.setState({show: false});
      return;
    }

    const json = await data.clone().json();
    if (json.error && json.error === this.component.dataset.message) {
      this.setState({show: true});
    }
  }

  render() {
    this.component.setAttribute('class', this.state.show ? 'error show' : 'error');
  }
}