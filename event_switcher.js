
class event_switcher {
  constructor(o, initial_event) {
    this.o = o;
    this._unhandled_events = [];
    this._events_linked = null;
  }
  
  staticLinkEvents() {
    if(!this._events_linked) {
      for(let i of this.o) {
        if(i !== 'constructor' && this.o[i] instanceof Function) {
          this.o[i].toString().replace(/\/\/ catch ([^\s]+)/g, ($0, eventName) => {
            // console.log(i, 'eventName', eventName, this[eventName]);
            if(!this.o[eventName].cbs) {
              this.o[eventName].cbs = []
            }
            this[eventName].cbs.push(i);
          });
        }
      }
      this._events_linked = true;
    }
  }
  
  addEvent(event, run = true) {
    this._unhandled_events.push(event);
    if(run) {
      while(this._unhandled_events.length) {
        this.dispatchUnhandledEvent();
      }
    }
  }
  
  dispatchUnhandledEvent() {
    this._event = this._unhandled_events.shift();
    if(this._event && this._event.eventType.cbs) {
      this._event.eventType.cbs.map(it => this.o[it](this._event));
    }
    this._event = undefined
  }
  
}

module.exports = event_switcher;


