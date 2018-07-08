require('./parser.rules.3');

class ReParser {
  
  _unhandled_events = [];
  
  static _events_linked;
  
  _staticLinkEvents() {
    if(!ReParser._events_linked) {
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
      ReParser._events_linked = true;
    }
  }
  
  _event = null;
  
  _dispatchUnhandledEvent() {
    this._event = this._unhandled_events.shift();
    if(this._event && this._event.eventType.cbs) {
      this._event.eventType.cbs.map(it => it.apply(this, this._event));
    }
    this._event = undefined
  }
  
  
  static context2context = context2context;
  static num2context = {};
  
  source = "";
  // parsed_path = [
  //   {
  //     between_length: 0,
  //     context_name: "",
  //     context_to: "",
  //     left_space_length: 0,
  //     content_length: 0,
  //     right_space_length: 0,
  //   }
  // ];
  
  parsed_path = [];
  
  Event_ParseStart        ({ pos, context             }) { arguments.eventType = this.Event_ParseStart        ; this._unhandled_events.push(arguments); }
  Event_PossibleTokenFound({ pos, context, idx, token }) { arguments.eventType = this.Event_PossibleTokenFound; this._unhandled_events.push(arguments); }
  Event_TokenAdded        ({ pos, context, idx, token }) { arguments.eventType = this.Event_TokenAdded        ; this._unhandled_events.push(arguments); }
  Event_NextTokenNotFound ({ pos, context, idx, token }) { arguments.eventType = this.Event_NextTokenNotFound ; this._unhandled_events.push(arguments); }
  Event_TokenRemoved      ({ pos, context, idx        }) { arguments.eventType = this.Event_TokenRemoved      ; this._unhandled_events.push(arguments); }
  Event_FullPathFound     ({ path                     }) { arguments.eventType = this.Event_FullPathFound     ; this._unhandled_events.push(arguments); }
  Event_ParseFinish       ({ path                     }) { arguments.eventType = this.Event_ParseFinish       ; this._unhandled_events.push(arguments); }
  
  // Event_ExistingTokenFound() { arguments.eventType = this.Event_ExistingTokenFound; this._unhandled_events.push(arguments); }
  
  constructor(source) {
    this.source = source;
    this.parsed_path.push({
      context_name: '_unparsed',
      context_to: '',
      between_spaces_left_length: 0,
      between_length: 0,
      between_spaces_right_length: 0,
      content_length: source.length,
    });
    this._staticLinkEvents();
  }
  
  addRemoverCursor = {pos: 0, idx: 0, context: "/root>"};
  
  addRemoverCursorGoAndSplitUnparsed (pos, idx) {
    // здесь нужно, если элемента не было, из текущей позиции, в которой мы уверены, "допрыгать" до
    // позиции из аргументов. проверить, если позиция из аргументов лежит внутри _unparsed, и разорвать
    // на две _unparsed
  
    function checkPosIdx(last_pos, pos, last_idx, idx) {
      if((last_pos - pos) * (last_idx - idx) < 0 || (last_idx === idx && pos !== pos)) { // sign should be the same
        throw "Strange " + JSON.stringify({last_pos, pos, last_idx, idx})
      }
    }
  
    let last_pos     = this.addRemoverCursor.pos;
    let last_idx     = this.addRemoverCursor.idx;
    let last_context = this.addRemoverCursor.context;
  
    checkPosIdx(last_pos, pos, last_idx, idx);
  
    while(pos <= this.addRemoverCursor.pos && idx <= this.addRemoverCursor.idx && this.parsed_path[this.addRemoverCursor.idx - 1]) {
      // // go left
      // last_pos      = this.addRemoverCursor.pos    ;
      // last_idx      = this.addRemoverCursor.idx    ;
      // last_context  = this.addRemoverCursor.context;
      //
      // checkPosIdx(last_pos, pos, last_idx, idx);
      //
      // let token = this.parsed_path[last_idx - 1];
      //
      // this.addRemoverCursor.pos -=
      //   token.between_spaces_left_length +
      //   token.between_length +
      //   token.between_spaces_right_length +
      //   token.content_length;
      // this.addRemoverCursor.idx--;
      // this.addRemoverCursor.context = this.addRemoverCursor.context
      //   .substr(0, this.addRemoverCursor.context.length - token.context_add)
      //   + token.context_cut
      // ;
      this.addRemoverCursor.pos = 0;
      this.addRemoverCursor.idx = 0;
      this.addRemoverCursor.context = "/root>";
    }
  
    last_pos     = this.addRemoverCursor.pos;
    last_idx     = this.addRemoverCursor.idx;
    last_context = this.addRemoverCursor.context;
  
    checkPosIdx(last_pos, pos, last_idx, idx);
  
    while(pos >= this.addRemoverCursor.pos && idx >= this.addRemoverCursor.idx && this.parsed_path[this.addRemoverCursor.idx]) {
  
      // go right
      last_pos     = this.addRemoverCursor.pos    ;
      last_idx     = this.addRemoverCursor.idx    ;
      last_context = this.addRemoverCursor.context;
    
      checkPosIdx(last_pos, pos, last_idx, idx);
    
      let token = this.parsed_path[last_idx];
    
      if(token.context_name === '_unparsed') {
        this.addRemoverCursor.context = "_unparsed"
      }
      
      this.addRemoverCursor.pos +=
        token.between_spaces_left_length +
        token.between_length +
        token.between_spaces_right_length +
        token.content_length;
      this.addRemoverCursor.idx++;
      this.addRemoverCursor.context = this.addRemoverCursor.context
        .substr(0, this.addRemoverCursor.context.length - (token.context_cut || "").length)
        + token.context_add
      ;
    }
  
    this.addRemoverCursor.pos     = last_pos    ;
    this.addRemoverCursor.idx     = last_idx    ;
    this.addRemoverCursor.context = last_context;
  
    checkPosIdx(last_pos, pos, last_idx, idx);
  
    if(this.addRemoverCursor.pos < pos ) {
      if(this.parsed_path[this.addRemoverCursor.idx].context_name !== '_unparsed') {
        sb('не дошли до нужной позиции', this.addRemoverCursor, pos);
      }
      // сплитнуть напополам
      
      console.log('split', {addRemoverCursor: this.addRemoverCursor, pos});
  
      ni('split should not be used yet');
  
      pni("splitting _unparsed was not tested");
  
      this.parsed_path.splice(this.addRemoverCursor.idx, 1,
        {
          context_name: '_unparsed',
          context_to: '',
          between_spaces_left_length: 0,
          between_length: 0,
          between_spaces_right_length: 0,
          content_length: pos - this.addRemoverCursor.pos,
        },
        {
          context_name: '_unparsed',
          context_to: '',
          between_spaces_left_length: 0,
          between_length: 0,
          between_spaces_right_length: 0,
          content_length: this.parsed_path[this.addRemoverCursor.idx] - (pos - this.addRemoverCursor.pos),
        },
      );
    
      this.addRemoverCursor.pos = pos;
      this.addRemoverCursor.idx++;
    }
  }
  
  sum_lengths(token) {
    return  token.between_spaces_left_length +
            token.between_length +
            token.between_spaces_right_length +
            token.content_length;
  }
  
  addOrRemoveTokenToPathAndResizeUnparsed({ pos, context, idx, token }) {
    // catch Event_NextTokenNotFound
    // catch Event_PossibleTokenFound
  
    this.addRemoverCursorGoAndSplitUnparsed(pos, idx);
  
    if(this._event.eventType === this.Event_PossibleTokenFound) {
      if(this.parsed_path[this.addRemoverCursor.idx].context_name === '_unparsed') {
  

  
        let new_length = this.parsed_path[this.addRemoverCursor.idx].content_length - this.sum_lengths(token);
        
  
        
        if(new_length < 0) {
          sb("content_length should not be < 0", {new_length, parsed_path: this.parsed_path, addRemoverCursor: this.addRemoverCursor});
        }
        
        this.parsed_path[this.addRemoverCursor.idx].content_length = new_length;
        
        pni('отключено удаление токена, т.к. оно вызывает падение алгоритма на конце парсинга');
  
        // if(this.parsed_path[this.addRemoverCursor.idx].content_length === 0) {
        //   this.parsed_path.splice(this.addRemoverCursor.idx, 1);
        // }
  
        this.parsed_path.splice(this.addRemoverCursor.idx, 0, token);
        
        
        
        this.Event_TokenAdded({ pos: pos + this.sum_lengths(token), idx, token, context });
        
        return;
      } else {
        if(this.parsed_path[this.addRemoverCursor.idx + 1]  && this.parsed_path[this.addRemoverCursor.idx + 1].context_name !== '_unparsed') {
          ni('варианты: парсинг уже распарсенного');
        } else {
  
          // ni("нужно удалить предыдущий распарсенный токен и вставить новый");
          
          
          if(!this.parsed_path[this.addRemoverCursor.idx + 1]) {
            this.parsed_path.push({
              context_name: '_unparsed',
              context_to: '',
              between_spaces_left_length: 0,
              between_length: 0,
              between_spaces_right_length: 0,
              content_length: 0,
            });
          }
          
          this.parsed_path[this.addRemoverCursor.idx + 1].content_length += this.sum_lengths(this.parsed_path[this.addRemoverCursor.idx]) - this.sum_lengths(token);
          
          this.parsed_path[this.addRemoverCursor.idx] = token;
  
          if(!this.parsed_path[this.addRemoverCursor.idx + 1].content_length) {
            this.parsed_path.splice(this.addRemoverCursor.idx + 1, 1);
          }
          
          this.Event_TokenAdded({pos, context, idx, token});
    
          return
        }
      }
    }
    
    if(this._event.eventType === this.Event_NextTokenNotFound) {
      
      
      if(this.parsed_path[this.addRemoverCursor.idx + 1]  && this.parsed_path[this.addRemoverCursor.idx + 1].context_name !== '_unparsed') {
        let token = this.parsed_path[this.addRemoverCursor.idx + 1];
        this.parsed_path.splice(this.addRemoverCursor.idx + 1, 1);
        
        if(this.parsed_path[this.addRemoverCursor.idx + 1]  && this.parsed_path[this.addRemoverCursor.idx + 1].context_name === '_unparsed') {
          this.parsed_path[this.addRemoverCursor.idx + 1].content_length += this.sum_lengths(token);
          // console.log('this.parsed_path[this.addRemoverCursor.idx + 1].content_length', this.parsed_path[this.addRemoverCursor.idx + 1].content_length);
        } else {
          ni("Ожидается, что будет только _unparsed, другое поведение пока не реализовано");
        }
  
        return
      } else {
        // ni("ничего не делать – все в поряде (вроде)");
        
        return
      }
    }
    
    
  
  
    // записать найденный токен по позиции
    // если токен уже есть, а мы его на что-то реплейсим, то нужно посчитать все символы старого токена, добавить их
    // к _unparsed, потом посчитать сколько символов в новом токене и убрать их из _unparsed обратно
  
  
  
    throw 'not fully implemented'
  }
  
  parseStartContext = "";
  
  findNewTokenOrIterateLastOrFinishParsing({pos, context, idx, token}) {
    // catch Event_ParseStart
    // catch Event_TokenAdded
    // catch Event_NextTokenNotFound
    
    // aop.debugger(2);
    
    // ищем старый токен по этому индексу
    
    // если Parse_Start, то первый токен – либо на нулевой позиции (первый перед _unparsed), либо разорвет какой-то из unparsed
    // # ~ на самом деле, можно парсить для всех событий одним алгоритмом
    if(this._event.eventType === this.Event_ParseStart) {
      if(this.parsed_path.length === 1 && this.parsed_path[0].context_name === "_unparsed" && pos === 0) {
        idx = 0
      } else {
        ni('expected find index by pos');
      }
      if(!context) {
        context = "";
      }
      this.parseStartContext = context;
    }
    // если Event_Token_Added, то нужно продолжать поиск со следующей позиции
    if(this._event.eventType === this.Event_TokenAdded) {
  
      if(this.parseStartContext === context.substr(0, context.length - token.context_cut.length) + token.context_add ||
        this.parseStartContext === context.substr(0, context.length - token.context_cut.length) + token.context_add + ">"
      ) {
        pni("Не удаляется конечный _unparsed");
        pni("Не проверяется, что парсинг закончен полностью");
        this.Event_ParseFinish({path: this.parsed_path});
        return;
      }
  
      pni("I don't know what to do with pos in that case");
      // pos += this.sum_lengths(token);
      idx++;
      context = context.substr(0, context.length - token.context_cut.length) + token.context_add;
      token = undefined;
    }
    
    if(this._event.eventType === this.Event_NextTokenNotFound) {
      // вроде, все есть, можно просто продолжать алгоритм
    }
    
    //
    
    // ищем старый токен по этому индексу
  
    if(!token) {
      token = {
        context_name                : null,
        context_to                  : null,
        context_cut                 : "",
        context_add                 : "",
        between_spaces_left_length  : 0,
        between_length              : 0,
        between_spaces_right_length : 0,
        content_length              : 0,
      };
    } else {
      // создадим токен заново, потому что обработка в другой функции
      token = {
        context_name                : token.context_name,
        context_to                  : token.context_to,
        context_cut                 : token.context_cut,
        context_add                 : token.context_add,
        between_spaces_left_length  : token.between_spaces_left_length,
        between_length              : token.between_length,
        between_spaces_right_length : token.between_spaces_right_length,
        content_length              : token.content_length,
      };
    }
    
    let contexts = Object.keys(ReParser.context2context);
    
    for(let ci = token.context_name === null ? 0 : contexts.indexOf(token.context_name); ci < contexts.length; ci++ ) {
      // отфильтровать, если данный контекст не подходит
      
      if(contexts[ci] === "" && context !== "") {
        continue
      }
      
      let icontext = ReParser.context2context[contexts[ci]];
      if(!context.endsWith(contexts[ci])) {
        continue
      }
  
      // console.log(icontext, contexts[ci]);
 
      let to_contexts = Object.keys(icontext.to);
      
      for(let tci = token.context_to === null ? 0 : to_contexts.indexOf(token.context_to) + 1; tci < to_contexts.length ; tci ++ ) {
        let to_context = icontext.to[to_contexts[tci]];
        let to_name = to_contexts[tci];
        // проверить, что данный токен подходит
        // проверяем пробелы слева от between
        
        let between_spaces_left = "";
        let between = "";
        let between_spaces_right = "";
        let content = "";
  
        pni("Expected configurable collecting spaces, but it collect using hardcodeded /\\s+/ pattern");
        pni("Expected checking spaces to be configurable, but it's hardcoded now");

        if(typeof to_context.between_spaces_left !== 'undefined' && to_context.between_spaces_left > -1) {
          between_spaces_left = this._match_pattern(
            pos,
            /\s+/
          );
          // if(between_spaces_left === false && context.between_spaces_left) { // if spaces required, then we couldn't accept this token
          //   // continue
          //   pni("govnocode - придумать и сделать нормальную обработку пробелов");
          //   between_spaces_left =  ""
          // } else {
          //   between_spaces_left =  ""
          // }
          if(between_spaces_left === false) { // if spaces required, then we couldn't accept this token
            // continue
            pni("govnocode - придумать и сделать нормальную обработку пробелов");
            between_spaces_left =  ""
          }
        }
  
  
        if(to_context.between) {
          between = this._match_pattern(
            pos + between_spaces_left.length,
            to_context.between
          );
          if(between === false) {
            continue;
          }
        }
  
        if(typeof to_context.between_spaces_right !== 'undefined' && to_context.between_spaces_right > -1) {
          between_spaces_right = this._match_pattern(
            pos + between_spaces_left.length + between.length,
            /\s+/
          );
  
          // if(between_spaces_right === false && context.between_spaces_right) { // if spaces required, then we couldn't accept this token
          //   // continue
          //   pni("govnocode - придумать и сделать нормальную обработку пробелов");
          //   between_spaces_left =  ""
          // } else {
          //   between_spaces_right =  ""
          // }
          if(between_spaces_right === false ) { // if spaces required, then we couldn't accept this token
            pni("govnocode - придумать и сделать нормальную обработку пробелов");
            between_spaces_right =  ""
          }
        }
        // aop.debugger();
  
        if(to_context.content) {
          content = this._match_pattern(
            pos + between_spaces_left.length + between.length + between_spaces_right.length,
            to_context.content
          );
          if(content === false) {
            continue;
          }
        }
        
        pni('проверить, почему content может быть undefined, и убрать это');
        if(content === undefined) {
          content = "";
        }
        
        token.context_name = contexts[ci];
        token.context_to                  = to_name;
        token.between_spaces_left_length  = between_spaces_left .length;
        token.between_length              = between             .length;
        token.between_spaces_right_length = between_spaces_right.length;
        token.content_length              = content             .length;
        
        var new_context_name = context;
        var context_cut = "";
        var context_add = "";
  
        to_name.split('/').map((it, i, o) => {
          if(it === '..') {
            new_context_name = new_context_name.replace(o[i + 1] ? /\/[^/]+$/ : />\/[^/]+$/, function(it) {
              context_cut = it + context_cut;
              return "";
            })
          } else {
            context_add = context_add + '/' + it;
            new_context_name += '/' + it;
          }
        });
        
        token.context_add = context_add;
        token.context_cut = context_cut;
        
        this.Event_PossibleTokenFound({
          pos,
          context: context,
          idx: idx,
          token
        });
        
        return
      }
    }
    
    if(!this.parsed_path[idx - 1] || this.parsed_path[idx - 1].context_name === "_unparsed") {
      console.log(this.source);
      ni("Если ничего не удалось распарсить");
    }
    
    // aop.debugger(0);
    
    this.Event_NextTokenNotFound({
      pos: pos - this.sum_lengths(this.parsed_path[idx - 1]),
      context: context.substr(0, context.length - this.parsed_path[idx - 1].context_add.length) + this.parsed_path[idx - 1].context_cut,
      idx: idx - 1,
      token: this.parsed_path[idx - 1]
    });
  }
  
  
  _match_pattern(pos, pattern, text) {
    // returns false or matching string (even empty string)
    if(typeof text === 'undefined') {
      text = this.source.substr(pos)
    }
  
    if(pattern instanceof RegExp) {
      // преобразуем его в /^(pattern)/ и проверяем
      if(!pattern.right_pattern) {
        pattern.right_pattern = new RegExp("^(" + pattern.source + ")", pattern.flags);
      }
      let matches = text.match(pattern.right_pattern);
      if(matches) {
        return matches[0];
      } else
        return false
    } else if ( typeof pattern === 'string' ) {
      if(text.substr(0, pattern.length) === pattern) {
        return pattern
      } else {
        return false
      }
    } else if (pattern instanceof Function) {
      return pattern(this.source.substr(pos));
    } else if ( pattern instanceof Array ) {
      for(let it of pattern) {
        let result = this._match_pattern(it);
        if(result !== false) {
          return result;
        }
      }
      return false
    } else {
      throw new Error("Unknown data type for pattern: ", pattern);
    }
    
  }
  
  // _parseSpaces({pos, context, idx, token}){}
  
  
  // storePath(){}
  // findBestPath(){}
  
  
  parse(pos = 0, context = "/root>") {
  
    this.Event_ParseStart({pos: 0, context: "/root>"});
    let i = 0;
    while(this._unhandled_events.length) {
      if(i++ > 20000) {
        throw new Error("Too many operations while parsing");
      }
      // console.log('iteration ', i);
      // console.log(this);
      // console.log('unparsed:',
      //   JSON.stringify(this.source.substr(this.source.length - this.parsed_path[this.parsed_path.length - 1].content_length, this.source.length)),
      //   JSON.stringify(this.parsed_path[this.parsed_path.length - 2])
      // );
      this._dispatchUnhandledEvent();
    }
    
  }
  
  
}

console.log(ReParser.num2context);

// var aop = require('../yucalc3/aop');
//
// aop.test(function() {
//
//   ReParser.context2context = {
//     "": {
//       to: {
//         "ololo": {
//           content: "ololo"
//         },
//         "instruction[]>": {
//         }
//       }
//     },
//     "/instruction[]>": {
//       "to": {
//         "instruction": {
//           content: /[A-Z]/,
//         }
//       }
//     },
//     "/instruction[]": {
//       "to": {
//         "..": {
//
//         }
//       }
//     },
//     "/instruction[]>/instruction": {
//       "to": {
//         "../instruction": {
//           content: /[A-Z]/,
//           between: ";"
//         },
//         "..": {
//         },
//       },
//     },
//   };
//
//
//   var p  = new ReParser("A;A");
//
//   p.Event_ParseStart({pos: 0, });
//   let i = 0;
//   while(p._unhandled_events.length && i++ < 20) {
//     console.log('iteration ', i);
//     console.log(p);
//     // console.log(p._unhandled_events);
//     p._dispatchUnhandledEvent();
//   }
//
//
// });


// aop.test(function() {
//
//   ReParser.context2context = global.context2context;
//
//   // ReParser.parseRules([
//   //   {
//   //     sample: [
//   //       "SumIf(Table1:col1)",
//   //       "SumIf(Table1:col1, :col2 < 15, :col3 > 15)",
//   //       "SumIf(Table1:{col1 + col2})",
//   //       "SumIf(Table1:col1, :{col2 + col3} < 15)",
//   //     ],
//   //     context: [
//   //       "expression",
//   //       ""
//   //     ],
//   //     decode: {
//   //       ""                        : { _: "lookup" },
//   //       "SumIf"                   : { _: "name", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
//   //       "Table1"                  : { _: "table*", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/, wrap_spaces: true },
//   //       ":col1"                   : { _: "result", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
//   //       "col1"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
//   //       ":{col1 + col2}"          : { _: "result", },
//   //       "col1 + col2"             : { _: "[inline_expression]", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
//   //       ":col2 < 15, :col3 > 15"  : { _: "filter[]", between: /,/ },
//   //       ":col2 < 15"              : { _: "filter" , space: 1 },
//   //       "col2"                    : { _: "column", pattern: /[A-Za-z$_][A-Za-z$_0-9]*/ },
//   //       ":{col2 + col3} < 15"     : { _: "filter" , space: 1 },
//   //       ":{col2 + col3}"          : { _: "expression" , space: 1 },
//   //       "col2 + col3"             : { _: "[inline_expression]" , space: 1 },
//   //       "<"                       : { _: "operator", pattern: /((<|>)=?|=|==|===|in)/ },
//   //       "15"                      : { _: "value", rule: "inline_expression" },
//   //       // before: /\s*\)\s*/, after: /\s*\)\s*/
//   //     },
//   //     transforms: {
//   //       y_to_js: function(node, tree, code = "") {
//   //         // console.log('start', starts.get(node));
//   //         // console.log('end', ends.get(node));
//   //         return `${node.name}(
//   //         function(n, {${node.result_expression}}) { return this.${node.result_expression}(n) },
//   //         function(n, {${node.filter.map(it=>it.column).join("\n")}, val}) { return this.${node.column}(n) ${node["operator"]} val }, ${node.value}
//   //       )`;
//   //         return `SumIf(
//   //         function(n, {col1}) { return this.col1(n) },
//   //         function(n, {col2, col3, val}) { return this.col2(n) < 15 }
//   //       )`;
//   //       }
//   //     }
//   //   },
//   // ]);
//
//   var p ;
//   p = new ReParser("Lookup(Re:Ku)");
//
//   p.Event_ParseStart({pos: 0, context: "/root>" });
//   let i;
//   i = 0;
//   while(p._unhandled_events.length && i++ < 2000) {
//     console.log('iteration ', i);
//     console.log(p);
//     console.log('unparsed:', JSON.stringify(p.source.substr(p.source.length - p.parsed_path[p.parsed_path.length - 1].content_length, p.source.length)));
//     // console.log(p._unhandled_events);
//     p._dispatchUnhandledEvent();
//   }
//
//   console.log(p);
//
//   var p ;
//   p = new ReParser("Lookup(Re:Ku, :Zu = 5)");
//
//   p.Event_ParseStart({pos: 0, context: "/root>"});
//   i = 0;
//   while(p._unhandled_events.length && i++ < 2000) {
//     console.log('iteration ', i);
//     console.log(p);
//     console.log('unparsed:', JSON.stringify(p.source.substr(p.source.length - p.parsed_path[p.parsed_path.length - 1].content_length, p.source.length)));
//     // console.log(p._unhandled_events);
//     p._dispatchUnhandledEvent();
//   }
//
//   console.log(p);
//
//   p  = new ReParser("Lookup(Re:Ku, :Zu = 5, :Du > 7, :Nu < 5)");
//
//   p.Event_ParseStart({pos: 0, context: "/root>"});
//   i = 0;
//   while(p._unhandled_events.length && i++ < 2000) {
//     console.log('iteration ', i);
//     console.log(p);
//     // console.log(p._unhandled_events);
//     p._dispatchUnhandledEvent();
//   }
//
//   p  = new ReParser(` Lookup ( Re:Ku,
//                                   :Zu = 5,
//                                   :Du > 7,
//                                   :Nu < 5);suifuwo`);
//
//   p.Event_ParseStart({pos: 0, context: "/root>"});
//   i = 0;
//   while(p._unhandled_events.length && i++ < 2000) {
//     console.log('iteration ', i);
//     console.log(p);
//     // console.log(p._unhandled_events);
//     p._dispatchUnhandledEvent();
//   }
//
//
// });



/*

каждый parsed_token содержит:
- тип (собственное название контекста)
- распарсерый простой контент
-


 */

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

module.exports.ReParser = ReParser;