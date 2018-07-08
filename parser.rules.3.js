


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
      "root"
    ],
    decode: {
      ""    : {_: "expression[]", between: ";" },
      "f()" : {_: "expression"},
    }
  },
  {
    sample: [
      "SumIf(Table1:col1)",
      // "SumIf(Table1:col1, default_val)",
      "SumIf(Table1:col1, :col2 < 15, 17)",
      "SumIf(Table1:{col5 + col6})",
      "SumIf(Table1:col1, :{col7 + col8} < 15)",
    ],
    context: [
      "expression",
    ],
    decode: {
      ""                        : { _: "lookup" },
      "SumIf"                   : { _: "name", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
      "Table1"                  : { _: "table", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
      ":col1"                   : { _: "result", wrap_spaces: true  },
      "col1"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
      ":{col5 + col6}"          : { _: "wrapped_result", wrap_spaces: true  },
      "col5 + col6"             : { _: "expression", contains_context: "inline_expression", wrap_spaces: true  },
      ":col2 < 15, 17"          : { _: "filter[]", between: /,/, wrap_spaces: true  },
      ":col2 < 15"              : { _: "filter" , wrap_spaces: true  },
      ":col2"                   : { _: "left_side", wrap_spaces: true  },
      "col2"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true  },
      ":{col7 + col8} < 15 "    : { _: "filter[]" , between: /,/ , wrap_spaces: true  },
      ":{col7 + col8} < 15"     : { _: "filter" , wrap_spaces: true  },
      ":{col7 + col8}"          : { _: "wrapped_left_side" , wrap_spaces: true  },
      "col7 + col8"             : { _: "expression", contains_context: "inline_expression", wrap_spaces: true },
      "<"                       : { _: "operator", pattern: /((<|>)=?|==?=?|in)/, wrap_spaces: true  },
      "15 "                     : { _: "value", contains_context: "inline_expression", wrap_spaces: true },
      "17 "                     : { _: "local_value", contains_context: "inline_expression", wrap_spaces: true },
      // "default_val"             : { _: "default_value", contains_context: "inline_expression", wrap_spaces: true }
    },
  },
  {
    sample: " 2 + 2 ",
    context: "",
    decode: {
      " 2 + 2 "                  : {_: "inline_expression" },
      "2 + 2 "                   : {_: "js_tested_expression", pattern: (code) => {
          // search for largest expression that does not have , as a next symbol
          let inline_expression;
          for(let i = 1; i <= code.length; i++) {
            try {
              new Function("return {a:"+ code.substr(0, i) + "}");
              inline_expression = code.substr(0, i);
              if(code[i] === ',') {
                return inline_expression
              }
            } catch(e) {
            
            }
          }
          return inline_expression
        }
      }
    }
  }
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
  let proxy_rules = {
    get: function(target, key) {
      // console.log('target', target);
      if(!target[key]) {
        target[key] = {}
      }
      return new Proxy(target[key], proxy_rules)
    },
    set: function(target, key, val) {
      if(val instanceof Array) {
        if(val.length === 0) {
          if(!target[key]) {
            target[key] = []
          }
        } else {
          throw new Error("Not sure what to do");
        }
      } else {
        if(val.constructor === Object) {
          if(!target[key]) {
            target[key] = {}
          }
          for(let i in val) {
            if(typeof val[i] !== 'undefined') {
              target[key][i] = val[i];
            }
          }
        } else {
          target[key] = val
        }
      }
      return true;
    },
  };
  update_fn(new Proxy(objects, proxy_rules));
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
  
  
  parse(samples) {
    
    for(let sample of samples) {

      if(sample.name === "[space]") {
        pni('пробелы не оттестированы');
        context2context[space] = {
          pattern: sample.pattern
        };
        continue;
      }
      
      if(Object.keys(sample.decode)[0].toString().match(/^\d+$/)) {
        throw new Error("Numeric decodes must be wrapped by spaces, decoding " + JSON.stringify(sample.sample));
      }

      for(let root_sample_str of sample.sample instanceof Array ? sample.sample : [sample.sample]) {
  
        let sample_strs = [root_sample_str];
        let sample_str2contexts = {
          [root_sample_str]: sample.context instanceof Array ? sample.context : [sample.context]
        };
        
        for(let sample_str of sample_strs) {
          // console.log('parsing sample_strs ', sample_strs);
          
          let context    = sample_str2contexts[sample_str].context;
          context    =  context instanceof Array ? context : [context];
          
          // console.log(sample_str, sample);
  
  
          let expr = sample_str.trim();
          let decode_order = [];
          let decodes_in_order = [];
          let betweens = [];
  
          parseSubSamples: {
            let pass = true;
    
            for(let decode_substr in sample.decode) {
              let decode = sample.decode[decode_substr];
              if(!decode.subsample_name) {
                decode.subsample_name = decode_substr || root_sample_str;
              }
              if(decode_substr === "" ? root_sample_str === sample_str : sample_str === decode_substr) {
                pass = false;
                continue
              }
              if(pass) {
                continue
              }
              let idx = decode_order.length;
              expr = expr.replace(decode_substr.trim(), "\x00\x01\x02" + idx + "\x02\x01\x00");
              decode_order.push(decode);
            }
    
            expr.replace(/\x00\x01\x02[0-9]+\x02\x01\x00/g, function(a, num) {
              num = Number(a.match(/[0-9]+/)[0]);
              decodes_in_order.push(decode_order[num]);
              if(!decode_order[num].pattern && sample_strs.indexOf(decode_order[num].subsample_name) === -1) {
                sample_strs.push(decode_order[num].subsample_name);
                
                // console.log('sample_str', sample_str, 'subsample_name', decode_order[num].subsample_name);
                
                sample_str2contexts[decode_order[num].subsample_name]
                  = sample_str2contexts[sample_str].map(it => it + '>/' + (sample.decode[sample_str] || sample.decode[""])._)
              }
            });
            betweens = expr.split(/\x00\x01\x02[0-9]+\x02\x01\x00/);
            pni('Нет вырезаются пробелы из авмататических between');
  
            if(sample.decode[sample_str === root_sample_str && sample.decode[""] ? "" : sample_str]._.endsWith("[]")) {
              betweens = ["", sample.decode[sample_str === root_sample_str && sample.decode[""] ? "" : sample_str].between, ""];
              decodes_in_order = [decodes_in_order[0],decodes_in_order[0]]
            }
  
            
            // cut spaces
            // console.log(betweens);
            betweens = betweens.map(it => it.replace ? it.replace(/^\s+|\s+$/g, '') : it);
          }
  
          if(!decodes_in_order.length) {
            pni("Not sure if that's right or not");
            console.log('bypassing');
            continue
          }
  
          // console.log('decodes_in_order', decodes_in_order);
          // console.log('betweens', betweens);
          // console.log('sample_str2contexts', sample_str2contexts);
          
          
          writeToContext2Context: {
            for(var c of sample_str2contexts[sample_str]) {
              let decode;
              if(sample_str === root_sample_str && sample.decode[""]) {
                decode = sample.decode[""]
              } else {
                decode = sample.decode[sample_str]
              }
              
              // console.log('contexts', sample_str, c, decode);
  
              pni('Не реализованы по нормальному wrap_spaces и wrap_spaces_left/right');
              pni('Нет поддержки опционалных полей');
  
  
              if(sample_str === root_sample_str && c) {
                wrapCreateNotExistingPaths(context2context, (context2context) => {
                  context2context[
                      (c && "/" + c + '>')
                    ].to[
                      decode._ + (decode.pattern ? "" : ">")
                    ] = {
                    content: decode.pattern,
                    between_spaces_right: decode.wrap_spaces_left   || decode.wrap_spaces
                  };
                });
              }
  
              for(let i = 0, prev, next; next = decodes_in_order[i], prev = decodes_in_order[i - 1], next || prev; i++) {
                pni(`Надо проверить ...decode._ + ">/" + (prev ? prev._ : "")... странно, что может заканчиваться на /`);
                wrapCreateNotExistingPaths(context2context, (context2context) => {
                  context2context[
                    !prev
                      ? (c && "/" + c + '>') + '/' + decode._ + ">"
                      : (c && "/" + c + '>') + '/' + decode._ + ">/" + prev._
                  ].to[
                    next
                      ? (prev ? "../" : "") + (next || decode)._ + ((next || decode).pattern ? "" : ">")
                      : ".."
                  ] = {
                    content: next && next.pattern,
                    between: betweens[i] || undefined,
                    between_spaces_left : prev ? prev.wrap_spaces_right || prev.wrap_spaces : decode.wrap_spaces_left  || decode.wrap_spaces,
                    between_spaces_right: next ? next.wrap_spaces_left  || next.wrap_spaces : decode.wrap_spaces_right || decode.wrap_spaces,
                  };
                });
                
                if(prev && prev.contains_context) {
                  wrapCreateNotExistingPaths(context2context, (context2context) => {
                    context2context[
                      (c && "/" + c + '>') + '/' + decode._ + ">/" + prev._ + ">"
                    ].to[
                      prev.contains_context + ">"
                    ] = {
                      content: next && next.pattern,
                      between: betweens[i] || undefined,
                      between_spaces_left : prev ? prev.wrap_spaces_right || prev.wrap_spaces : decode.wrap_spaces_left  || decode.wrap_spaces,
                      between_spaces_right: next ? next.wrap_spaces_left  || next.wrap_spaces : decode.wrap_spaces_right || decode.wrap_spaces,
                    };
                    context2context[
                      (c && "/" + c + '>') + '/' + decode._ + ">/" + prev._ + '>/' + prev.contains_context
                    ].to[
                      '..'
                    ] = {
                      content: next && next.pattern,
                      between: betweens[i] || undefined,
                      between_spaces_left : prev ? prev.wrap_spaces_right || prev.wrap_spaces : decode.wrap_spaces_left  || decode.wrap_spaces,
                      between_spaces_right: next ? next.wrap_spaces_left  || next.wrap_spaces : decode.wrap_spaces_right || decode.wrap_spaces,
                    };
                  });
                }
                
              }
  
              if(sample_str === root_sample_str) {
                wrapCreateNotExistingPaths(context2context, (context2context) => {
                  context2context[
                      (c && c + '>') + '/' + decode._
                    ].to[
                      '..'
                    ] = {
                    between_spaces_left: decode.wrap_spaces_right || decode.wrap_spaces
                  };
                });
              }
              
              pni("нужно сделать обработку contains")
            }

          }
  
        }
      }
    }
  }
  
}

context2context = {
  // "": {}
};

// var aop = require('../yucalc3/aop');
//
// aop.test(function() {
//   let pr = new ReParser_Rules();
//  
//   // pr.iterateSamples(samples);
//  
//   let i = 0;
//  
//   let sample = {
//     sample: [
//       // "SumIf(Table1:col1)",
//       "SumIf(Table1:col1, :col2 < 15, :col3 > 17)",
//       "SumIf(Table1:{col5 + col6})",
//       "SumIf(Table1:col1, :{col7 + col8} < 15)",
//     ],
//     context: [
//       "expression",
//     ],
//     decode: {
//       ""                        : { _: "lookup" },
//       "SumIf"                   : { _: "name", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
//       "Table1"                  : { _: "table*", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
//       ":col1"                   : { _: "result" },
//       "col1"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
//       ":{col5 + col6}"          : { _: "wrapped_result", },
//       "col5 + col6"             : { _: "expression", contains: "inline_expression" },
//       ":col2 < 15, :col3 > 17"  : { _: "filter[]", between: /,/ },
//       ":col2 < 15"              : { _: "filter" , space: 1 },
//       ":col2"                   : { _: "left_side" },
//       "col2"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
//       ":{col7 + col8} < 15 "    : { _: "filter[]" , space: 1 },
//       ":{col7 + col8} < 15"     : { _: "filter" , space: 1 },
//       ":{col7 + col8}"          : { _: "wrapped_left_side" , space: 1 },
//       "col7 + col8"             : { _: "expression", contains: "inline_expression", space: 1 },
//       "<"                       : { _: "operator", pattern: /((<|>)=?|==?=?|in)/ },
//       "15 "                     : { _: "value", contains: "inline_expression"  },
//     },
//   };
//  
//   pr.parse(samples);
//  
//   console.log(context2context);
//  
// });
//
// let pr = new ReParser_Rules();
// pr.parse(samples);
//
// global.context2context = context2context;
// // context2context[""] = context2context[">"];
// console.log(context2context);
// // throw "aaa";
