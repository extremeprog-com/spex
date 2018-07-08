RegExp.prototype.toJSON = RegExp.prototype.toString;

space = Symbol('space');

samples = [
  {
    name : "[space]",
    context: [
      "*"
    ],
    pattern: /^\s+/
  },
  {
    sample: "f();f()",
    context: [
      ""
    ],
    decode: {
      "" : {_: "expression[]", between: ";" },
      "f()"     : {_: "expression"},
    }
  },
  {
    sample: [
      "SumIf(Table1:col1)",
      "SumIf(Table1:col1, :col2 < 15, :col3 > 15)",
      "SumIf(Table1:{col1 + col2})",
      "SumIf(Table1:col1, :{col2 + col3} < 15)",
    ],
    context: [
      "expression",
    ],
    decode: {
      ""                        : { _: "lookup" },
      "SumIf"                   : { _: "name", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
      "Table1"                  : { _: "table*", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
      ":col1"                   : { _: "result", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      "col1"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      ":{col1 + col2}"          : { _: "result", },
      "col1 + col2"             : { _: "[inline_expression]", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      ":col2 < 15, :col3 > 15"  : { _: "filter[]", between: /,/ },
      ":col2 < 15"              : { _: "filter" , space: 1 },
      "col2"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      ":{col2 + col3} < 15"     : { _: "filter" , space: 1 },
      ":{col2 + col3}"          : { _: "expression" , space: 1 },
      "col2 + col3"             : { _: "[inline_expression]" , space: 1 },
      "<"                       : { _: "operator", pattern: /((<|>)=?|=|==|===|in)/ },
      "15"                      : { _: "value", rule: "inline_expression" },
    },
  },
];

function ni(descr) {
  throw new Error("Not fully implemented: " + descr);
}

function pni(descr) {
  if(!pni[descr]) {
    pni[descr] = true;
    console.warn(new Error("Warning - not fully implemented: " + descr).stack);
  }
}

function sb(descr, ...args) {
  throw new Error("Strange behaviour: " + descr + (args && args.length ? JSON.stringify(args) : ""));
}

function wrapCreateNotExistingPaths(objects, update_fn) {
  let proxied = {}, proxy_rules = {
    get: function(target, key) {
      if(!target[key]) {
        target[key] = {}
      }
      return new Proxy(target[key], proxy_rules)
    },
    set: function(target, key, val) {
      if(val instanceof Array && val.length === 0) {
        if(!target[key]) {
          target[key] = []
        }
      } else {
        target[key] = val
      }
    },
  };
  for(let i in objects) {
    proxied[i] = new Proxy(objects[i], proxy_rules)
  }
  update_fn(proxied);
}


`
проектирование разбора выражений через CORE

Objects:
Rules (result – context2context)
Sample
Found

Events:
Event_NewSample
Event_FoundExpression
Event_ExpressionParsed

Methods:

iterateSamples
  <- (called firectly)
  –> Event_FoundExpression

parseSampleToExpressions()
  <- Event_NewSample
  -> Event_FoundExpression

parseExpressionAndSubExpressions()
  <- Event_FoundExpression
  -> Event_ExpressionParsed

convertExpressionToContext2Context()
  <- Event_ExpressionParsed
  
`;

class ReParser_Rules {
  
  _unhandled_events = [];
  
  _staticLinkEvents() {
    for(let i of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
      if(i !== 'constructor' && this[i] instanceof Function) {
        this[i].toString().replace(/\/\/ catch ([^\s]+)/g, ($0, eventName) => {
          // console.log(i, 'eventName', eventName, this[eventName]);
          if(!this[eventName].cbs) {
            this[eventName].cbs = []
          }
          this[eventName].cbs.push(this[i]);
        });
      }
    }
  }
  
  _event = null;
  
  _dispatchUnhandledEvent() {
    this._event = this._unhandled_events.shift();
    if(this._event && this._event.eventType.cbs) {
      this._event.eventType.cbs.map(it => {console.log(it.name + " call ( " + JSON.stringify(this._event[0]).substr(0, 128) + "... )"); it.apply(this, this._event)});
    }
    this._event = undefined
  }
  
  constructor(source) {
    this._staticLinkEvents();
  }
  
  Event_NewSample        ({sample                                  }) { arguments.eventType = this.Event_NewSample         ; this._unhandled_events.unshift(arguments); }
  Event_FoundExpression  ({expression, context, sample, decode_pos }) { arguments.eventType = this.Event_FoundExpression   ; this._unhandled_events.unshift(arguments); }
  Event_ExpressionParsed ({                                        }) { arguments.eventType = this.Event_ExpressionParsed  ; this._unhandled_events.unshift(arguments); }
  
  iterateSamples(samples) {
    for(let sample of samples) {
      (sample.sample instanceof Array ? sample.sample : [sample.sample]).map(sample_name => {
        this.Event_NewSample({
          sample: {
            name: sample_name,
            context: sample.context instanceof Array ? [...sample.context] : [sample.context],
            decode : sample.decode,
          }
        });
      });
    }
  }
  
  parseSampleToExpressions({sample}) {
    // catch Event_NewSample
    
    //
    
  
    ni('');
  }
  
  parseExpressionAndSubExpressions() {
    // catch Event_FoundExpression
    
    ni('');
  }
  
  convertExpressionToContext2Context() {
    // catch Event_ExpressionParsed
  
    ni('');
  }
}

context2context = {
  "": {}
};

var aop = require('../yucalc3/aop');

aop.test(function() {
  let pr = new ReParser_Rules();
  
  // pr.iterateSamples(samples);
  
  let i = 0;
  
  let sample = {
    sample: [
      "SumIf(Table1:col1)",
      "SumIf(Table1:col1, :col2 < 15, :col3 > 15)",
      "SumIf(Table1:{col1 + col2})",
      "SumIf(Table1:col1, :{col2 + col3} < 15)",
    ],
    context: [
      "expression",
    ],
    decode: {
      ""                        : { _: "lookup" },
      "SumIf"                   : { _: "name", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
      "Table1"                  : { _: "table*", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
      ":col1"                   : { _: "result", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      "col1"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      ":{col1 + col2}"          : { _: "result", },
      "col1 + col2"             : { _: "[inline_expression]", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      ":col2 < 15, :col3 > 15"  : { _: "filter[]", between: /,/ },
      ":col2 < 15"              : { _: "filter" , space: 1 },
      "col2"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      ":{col2 + col3} < 15"     : { _: "filter" , space: 1 },
      ":{col2 + col3}"          : { _: "expression" , space: 1 },
      "col2 + col3"             : { _: "[inline_expression]" , space: 1 },
      "<"                       : { _: "operator", pattern: /((<|>)=?|=|==|===|in)/ },
      "15"                      : { _: "value", rule: "inline_expression" },
    },
  };
  
  // pr.iterateSamples(samples);
  pr.Event_FoundExpression({
    expression: "SumIf(Table1:col1)",
    context   : ["expression"],
    decode_pos: 3,
    sample    : sample,
  });
  
  console.log({output: `
    context2context = {
       "result"
    }
  `});
  while(pr._unhandled_events.length && i++ < 10) {
    console.log('iteration', i);
    console.log(pr._unhandled_events[0].eventType.name, JSON.stringify(pr._unhandled_events[0][0]).substr(0, 128) + '...' + " }");
    pr._dispatchUnhandledEvent();
  }
  
});
