// var program = 'const answer = 42';

transforms = {};
parents = new WeakMap();
names = new WeakMap();
token2parser_node = new WeakMap();
starts = new WeakMap();
ends = new WeakMap();

require('./parser.rules');

function parsed_transform(rules_map, subtree, tree) {
  return rules_map.get(token2parser_node.get(subtree))(subtree, tree);
}

class ParserToken {
  toString() {
    return this._val;
  }
}

var last_pos = 0, last_context = "";

function partialParse(expr, startPos = 0, context = "", initial_context = context, parsed_parent_token = {}, name = "", depth = 0, out = false) {
  
  if(depth === 0 && !out) {
    last_pos = 0;
  }
  
  if(startPos > last_pos){
    last_pos = startPos;
    last_context = context;
  }
  
  var mspace = "";
  
  if(mspace = expr.substr(startPos).match(context2context[space])) {
    startPos += mspace[0].length;
  }
  
  console.log('partialParse', ...arguments);
  
  var token = parsed_parent_token[name] = parsed_parent_token[name] || new ParserToken();
  
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
      let err = new Error('Cannot find anything for value ' + expr + ' on position ' + last_pos);
      last_pos = 0;
      throw err;
    }
  } else {
    throw wrongWay;
  }
  
}

parser(samples);

module.exports.partialParse = partialParse;


if(require.main === module && process.argv.indexOf('--debug') > -1) {
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
}


