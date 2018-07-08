// var program = 'const answer = 42';

RegExp.prototype.toJSON = RegExp.prototype.toString;


samples = [
  {
    sample: "SumIf(:col1, :col2 < 15)",
    decode: {
      "SumIf"              : { _: "lookup function name", pattern: /^[A-Za-z$_][A-Za-z$_0-9]*/ },
      "col1"               : { _: "lookup result expression", pattern: /^[A-Za-z$_][A-Za-z$_0-9]*/},
      "col2"               : { _: "lookup comparison expression", pattern: /^[A-Za-z$_][A-Za-z$_0-9]*/},
      "<"                  : { _: "lookup comparison operator", pattern: /^((<|>)=?|=|==|===|in)/},
      "15"                 : { _: "lookup comparison value", pattern: /^[0-9]+/},
      // before: /\s*\)\s*/, after: /\s*\)\s*/
    },
    name : "lookup function",
    context: [
      "expression"
    ],
    transforms: {
      y_to_js: function(node, tree, code = "") {
        // console.log('start', starts.get(node));
        // console.log('end', ends.get(node));
        return `${node['lookup function name']._val}(
          function(n, {${node["lookup result expression"]._val}}) { return this[${JSON.stringify(node["lookup result expression"]._val)}](n) },
          function(n, {${node["lookup comparison expression"]._val}, val}) { return this.${node["lookup comparison expression"]._val}(n) ${node["lookup comparison operator"]._val} val }, ${node["lookup comparison value"]._val}
        )`;
      }
    }
  },
  {
    sample: "f();f()",
    decode: {
      "f();f()"            : { _: "expression[]", between: /\s*(;|\n)\s*/},
      "f()"                : { _: "expression", pattern: /^[A-Za-z$_][A-Za-z$_0-9]*/},
      "col2"               : { _: "lookup comparison expression", pattern: /^[A-Za-z$_][A-Za-z$_0-9]*/},
      "<"                  : { _: "lookup comparison operator", pattern: /^((<|>)=?|=|==|===|in)/},
      "15"                 : { _: "lookup comparison value", pattern: /^[0-9]+/},
      // before: /\s*\)\s*/, after: /\s*\)\s*/
    },
    name : "lookup function",
    context: [
      "expression"
    ],
    transforms: {
      y_to_js: function(node, tree, code = "") {
        // console.log('start', starts.get(node));
        // console.log('end', ends.get(node));
        return `${node['lookup function name']._val}(
          function(n, {${node["lookup result expression"]._val}}) { return this[${JSON.stringify(node["lookup result expression"]._val)}](n) },
          function(n, {${node["lookup comparison expression"]._val}, val}) { return this.${node["lookup comparison expression"]._val}(n) ${node["lookup comparison operator"]._val} val }, ${node["lookup comparison value"]._val}
        )`;
      }
    }
  },
];


parser = function(samples) {
  for(let sample of samples) {
    let expr = sample.sample;
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
      
      if(!context2context[c]) {
        context2context[c] = {}
      }
      if(!context2context[c].in) {
        context2context[c].in = {}
      }
      if(!context2context[c].in[sample.name]) {
        context2context[c].in[sample.name] = {}
      }
  
      if(betweens[0].length) {
        context2context[c].in[sample.name].between = betweens[0];
      }
  
      if(!context2context[c + "." + sample.name]) {
        context2context[c + "." + sample.name] = {}
      }
      
      let i;
      for(i = 0; i < decodes_in_order.length; i++) {
        let decode = decodes_in_order[i];
        if(i === 0) {
          if(!context2context[c + "." + sample.name].in) {
            context2context[c + "." + sample.name].in = {}
          }
          if(!context2context[c + "." + sample.name].in[decode._]) {
            context2context[c + "." + sample.name].in[decode._] = {}
          }
        }
        
        if(!context2context[c + "." + sample.name + "." + decode._]) {
          context2context[c + "." + sample.name + "." + decode._] = {}
        }
  
        if(decode.pattern) {
          context2context[c + "." + sample.name + "." + decode._].pattern = decode.pattern;
        }
        
        if(i > 0){
          if(!context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].next) {
            context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].next = {}
          }
          if(!context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].next[decode._]) {
            context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].next[decode._] = {}
          }
          if(betweens[i].length) {
            context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].next[decode._].between = betweens[i];
          }
        }
      }

      if(!context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].out) {
        context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].out = {}
      }
      if(!context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].out[c + "." + sample.name]) {
        context2context[c + "." + sample.name + "." + decodes_in_order[i - 1]._].out[c + "." + sample.name] = {}
      }
  
      if(!context2context[c + "." + sample.name].out) {
        context2context[c + "." + sample.name].out = {}
      }
      if(!context2context[c + "." + sample.name].out[c]) {
        context2context[c + "." + sample.name].out[c] = {}
      }
      
      if(betweens[i].length) {
        context2context[c + "." + sample.name].out[c].between = betweens[i];
      }
  
      if(sample.transforms) {
        for(var t in sample.transforms) {
          if(!transforms[t]) {
            transforms[t] = new WeakMap();
          }
          transforms[t].set(context2context[c + "." + sample.name], sample.transforms[t]);
        }
      }
  
  
    }
  }
};



context2context = {
  "": {}
};


var transforms = {};
var parents = new WeakMap();
var names = new WeakMap();
var token2parser_node = new WeakMap();
var starts = new WeakMap();
var ends = new WeakMap();


function parsed_transform(rules_map, subtree, tree) {
  return rules_map.get(token2parser_node.get(subtree))(subtree, tree);
}


function partialParse(expr, startPos = 0, context = "", initial_context = context, parsed_parent_token = {}, name = "", depth = 0, out = false) {
  
  
  var token = parsed_parent_token[name] = parsed_parent_token[name] || {};
  
  if(!parents.get(token)) {
    parents.set(token, parsed_parent_token)
  }
  
  if(!names.get(token)) {
    names.set(token, name)
  }
  
  if(!starts.get(token)) {
    starts.set(token, startPos)
  }
  
  // 1. выбираем, в каком контексте мы находимся (из предоставленных сокращенных)
  for(let i in context2context) {
    if((context.endsWith(i) && i !== "") || (context === "" && i === "")) {
  
      token2parser_node.set(token, context2context[i]);
  
      let str = expr.substr(startPos), matches;
      
      if(context2context[i].pattern) {
        matches = str.match(context2context[i].pattern);
        if(!matches) {
          throw wrongWay;
        }
        token._val = matches[0];
      } else {
        matches = [""];
      }

      str = expr.substr(startPos + matches[0].length);
  
      if(context2context[i].next) {
        for(let next in context2context[i].next) {
          if(parsed_parent_token[next]) {
            continue;
          }
          let between_matches = "";
          if(typeof context2context[i].next[next].between !== 'undefined') {
            between_matches = str.indexOf(context2context[i].next[next].between) === 0;
            if(!between_matches) {
              continue;
            }
            between_matches = [context2context[i].next[next].between];
          } else {
            between_matches = [""];
          }
          try {
            partialParse(expr, startPos + matches[0].length + between_matches[0].length, context.replace(/\.[^.]+$/, "." + next), initial_context, parsed_parent_token, next, depth+1);
          } catch(e) {
            if(e === wrongWay) {
              console.log('delete parsed_parent_token[next]', context, next, new Error);
              // delete parsed_parent_token[next];
            } else {
              throw e;
            }
          }
          // contexts.pop();
        }
      }
      
      if(!out && context2context[i].in) {
        for(let next in context2context[i].in) {
          if(token[next]) {
            continue;
          }
          let between_matches = "";
          if(context2context[i].in[next].between) {
            between_matches = str.indexOf(context2context[i].in[next].between) === 0;
            if(!between_matches) {
              continue;
            }
            between_matches = [context2context[i].in[next].between];
          } else {
            between_matches = [""];
          }
          try {
            partialParse(expr, startPos + matches[0].length + between_matches[0].length, context + "." + next, initial_context, token, next, depth + 1);
          } catch(e) {
            if(e === wrongWay) {
              console.log('delete token[next]', context, next, new Error);
              // delete token[next];
            } else {
              throw e;
            }
            // parse.pop();
          }
        }
      }
      if(context2context[i].out && depth > 0) {
        // console.log('check out');
        for(let next in context2context[i].out) {
          let between_matches = "";
          if(context2context[i].out[next].between) {
            between_matches = str.indexOf(context2context[i].out[next].between) === 0;
            if(!between_matches) {
              continue
            }
            between_matches = [context2context[i].out[next].between];
          } else {
            between_matches = [""];
          }
          if(context.replace(/\.[^.]+/, "") === initial_context) {
            // token.finish = startPos + matches[0].length + between_matches[0].length;
            if(!ends.get(token)) {
              ends.set(token, startPos + between_matches[0].length)
            }
            if(!token._val) {
              token._val = expr.substring(starts.get(token), ends.get(token));
            }
            return token
          } else {
            if(!ends.get(token)) {
              ends.set(token, startPos + between_matches[0].length)
            }
            if(!token._val) {
              token._val = expr.substring(starts.get(token), ends.get(token));
            }
            // console.log(name);
            // token.finish = startPos + matches[0].length + between_matches[0].length;
            return partialParse(expr, startPos + matches[0].length + between_matches[0].length, context.replace(/\.[^.]+$/, ""), initial_context, parents.get(parsed_parent_token), names.get(parsed_parent_token), depth - 1, true);
          }
        }
      }
  
  
    }
  }

  
  if(depth == 0) {
    if(Object.keys(token).length) {
      // console.log('parsed_token', token);
      return token
    } else {
      throw new Error('Cannot find anything for value ' + expr);
    }
  } else {
    throw wrongWay;
  }
  
}

parser(samples);

module.exports.partialParse = partialParse;


let aop = require('../yucalc3/aop.js');

aop.test(function() {
  require('inspector').open();
  setInterval(()=>{}, 1000);
  
  console.log();
  console.log("context2context", context2context);
  console.log("context2context=", JSON.stringify(context2context, null, '  '));
  console.log();
  
  
  let code;
  code = "SumIfVariance(:ZliStan, :TrivialConguer >= 251)";
  
  code = "sdfsdf;" + code + "; xxx";
  
  let p = partialParse(code, 7);
  
  var wrongWay = {};
  
  console.log('parsed', JSON.stringify(p, null, '  '));
  
  console.log(code);
  console.log(transforms.y_to_js);
  console.log(parsed_transform(transforms.y_to_js, p["lookup function"], p));
});


