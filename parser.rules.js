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
      // before: /\s*\)\s*/, after: /\s*\)\s*/
    },
    // transforms: {
    //   y_to_js: function(node, tree, code = "") {
    //     // console.log('start', starts.get(node));
    //     // console.log('end', ends.get(node));
    //     return `${node.name}(
    //       function(n, {${node.result_expression}}) { return this.${node.result_expression}(n) },
    //       function(n, {${node.filter.map(it=>it.column).join("\n")}, val}) { return this.${node.column}(n) ${node["operator"]} val }, ${node.value}
    //     )`;
    //     return `SumIf(
    //       function(n, {col1}) { return this.col1(n) },
    //       function(n, {col2, col3, val}) { return this.col2(n) < 15 }
    //     )`;
    //   }
    // }
  },
  // {
  //   sample: "f();f()",
  //   name : "expression[]",
  //   separator: ";",
  //   final_separator: true,
  //   context: [
  //     ""
  //   ],
  //   decode: {
  //     "f()"                : { _: "expression" },
  //   }
  // },
];

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
      this._event.eventType.cbs.map(it => {console.log(it.name + "call ( " + JSON.stringify(this._event[0]).substr(0, 128) + "... )"); it.apply(this, this._event)});
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
    
    console.log(sample);
    
  }
  
  parseExpressionAndSubExpressions() {
    // catch Event_FoundExpression
  }
  
  convertExpressionToContext2Context() {
    // catch Event_ExpressionParsed
    
  }
}

context2context = {
  "": {}
};

var aop = require('../yucalc3/aop');

// aop.test(function() {
//   parser(samples);
//   console.warn(context2context);
// });

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
    expression: ":col1",
    context   : ["expression/lookup"],
    decode_pos: 3,
    sample    : sample,
  });
  while(pr._unhandled_events.length && i++ < 10) {
    console.log('iteration', i);
    console.log(pr._unhandled_events[0].eventType.name, JSON.stringify(pr._unhandled_events[0][0]).substr(0, 128) + '...' + " }");
    pr._dispatchUnhandledEvent();
  }
  
});


parser = function(samples) {
  for(let sample of samples) {
    if(sample.name === "[space]") {
      context2context[space] = {
        pattern: sample.pattern
      };
      continue;
    }

    let sample_name = sample.name;

    (sample.sample instanceof Array ? sample.sample : [sample.sample]).map(expr => {
      let decode_order = [];
      for(let decode_name in sample.decode) {
        let decode = sample.decode[decode_name];
        expr = expr.replace(decode_name, "\0\1\2" + decode_order.length + "\2\1\0");
        decode_order.push(decode);
      }
      let decodes_in_order = [];
      expr.replace(/\0\1\2[0-9]+\2\1\0/g, function(a, num) {
        num = Number(a.match(/[0-9]+/)[0]);
        decodes_in_order.push(decode_order[num])
      });
      let betweens = expr.split(/\0\1\2[0-9]+\2\1\0/);
      for(var c of sample.context) {

        aop.debugger(0);

        wrapCreateNotExistingPaths({context2context}, ({context2context}) => context2context[c].in[sample_name]);

        if(betweens[0].length) {
          context2context[c].in[sample_name].between = betweens[0]
        }

        wrapCreateNotExistingPaths({context2context}, ({context2context}) => context2context[c + "." + sample_name]);

        let i;
        for(i = 0; i < decodes_in_order.length; i++) {
          let decode = decodes_in_order[i];
          if(i === 0) {
            wrapCreateNotExistingPaths({context2context}, ({context2context}) => context2context[c + "." + sample_name].in[decode._]);
          }

          wrapCreateNotExistingPaths({context2context}, ({context2context}) => context2context[c + "." + sample_name + "." + decode._]);

          if(decode.pattern) {
            context2context[c + "." + sample_name + "." + decode._].pattern = eval(decode.pattern.toString().replace("/", "/^"));
          }

          if(i > 0){
            wrapCreateNotExistingPaths({context2context}, ({context2context}) => context2context[c + "." + sample_name + "." + decodes_in_order[i - 1]._].next[decode._]);
            if(betweens[i].length) {
              context2context[c + "." + sample_name + "." + decodes_in_order[i - 1]._].next[decode._].between = betweens[i];
            }
            // if() {
            //
            // }
          }
        }

        wrapCreateNotExistingPaths({context2context}, ({context2context}) => context2context[c + "." + sample_name + "." + decodes_in_order[i - 1]._].out[c + "." + sample_name]);

        wrapCreateNotExistingPaths({context2context}, ({context2context}) => context2context[c + "." + sample_name].out[c]);

        if(betweens[i].length) {
          context2context[c + "." + sample_name].out[c].between = betweens[i];
        }

        if(sample.transforms) {
          for(var t in sample.transforms) {
            if(!transforms[t]) {
              transforms[t] = new WeakMap();
            }
            transforms[t].set(context2context[c + "." + sample_name], sample.transforms[t]);
          }
        }

      }
    });

  }
};



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
