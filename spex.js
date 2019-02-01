//require('./estimator');
let aop = process.argv.indexOf('--test') && require.main === module && require('./aop.js');
let event_switcher = require('./event_switcher.js');
let ReGenerator = require('./ReGenerator');

$$$ = {
   stat: {},
   // parsed_regexp(eval_fn) {
   //   eval_fn(`console.log('src_regexp',src_regexp,'parsed_regexp', parsed_regexp)`);
   //
   // },
   // parsed_root_sample(eval_fn) {
   //   eval_fn(`console.log('root_sample_sequence=',this.root_sample_sequence)`);
   // },
   // parsed_like_samples(fn_eval) {
   //   fn_eval(`console.log('like_sequences', this.like_sequences);`);
   // },
   // search_string(eval_fn) {
   //   eval_fn(`console.log('string=',string)`);
   // },
   // iterate_pos(eval_fn) {
   //   eval_fn('console.log("pos=", pos)');
   // },
   // iterate_pp(eval_fn) {
   //   eval_fn('console.log("pp=",pp, "ppi=", ppi)');
   // },
   // iterate_sp(eval_fn) {
   //   eval_fn('console.log("sp=",sp, "spi=", spi, "char=", string[spos], rule.extract[sp], rule.extract[sp].test(string[spos]))');
   // },
   // start_check_chars(eval_fn) {
   //   eval_fn('console.log("start_check_chars",string[start_pos], rule.extract ? rule.extract[0] : rule.values)');
   // },
   // iterate_char(eval_fn) {
   //   eval_fn('console.log("char_pos=",pos, "char=", string[pos], ltr ? string.substring(pos,pos + 10) : string.substring(pos - 10 ,pos), values || sublength);');
   // },
   // return_check_chars(eval_fn) {
   //   eval_fn(`console.log('check_result=',check_result, string.substr(pos, check_result.length))`);
   // },
   // next_char_iteration(zz) {
   //   console.loe(zz);
   // },
   // subsample_occurence_found() {
   //   console.log(arguments.callee.name);
   // },
   // subsample_occurence_not_found() {
   //   console.log(arguments.callee.name);
   // },
   // occurence_found() {
   //   console.log(arguments.callee.name);
   // },
   // finish_search() {
   //   console.log(this.stat);
   //   this.stat = {};
   // }
};

for (let i in $$$) {
   if ($$$[i] instanceof Function) {
      let z = $$$[i];
      $$$[i] = function (...args) {
         $$$.stat[i] = ++$$$.stat[i] || 1;
         // console.log(JSON.stringify($$$.stat));
         z(...args);
      }
   }
}

let regExpSplitter = /(\[[^\]]*\]|\\.|[^[({|^$])([*?+]?)/g;

let SpEx = module.exports = function (sample, {where, ...options}) {

   // fi`разобрать where и подставить в extract. должен получиться одномерный массив`;

   var root_sample = {_root: ""};

   function parse_sample_to_sequence(source_sample_to_parse, parse_root_sample = false) {
      let sample_to_parse = source_sample_to_parse;
      let dynamic_patterns = [];
      let x = 0;

      let seq = [];

      if (parse_root_sample) {
         let found = 0;
         sample_to_parse = sample_to_parse.replace(new RegExp(sample.replace(/([\]\[\/{}.?*\\])/g, "\\$1"), "g"), function () {
            found++;
            dynamic_patterns.push(root_sample);
            return "\0\1\2" + x + "\2\1\0"
         });
         if (found !== 1) {
            throw new Error("like expression should have the root substitution, and only one. found: " + found + " for expression " + source_sample_to_parse);
         }
         x++;
      }

      let _name_num = 0;

      for (var i in where) {
         if (!where[i].name) {
            where[i].name = "$_" + _name_num++;
         }
         sample_to_parse = sample_to_parse.replace(new RegExp(i.replace(/[\]\[\/{}.?*\\]/g, "\$0"), "g"), function () {
            dynamic_patterns.push(where[i]);
            if (where[i].extract instanceof RegExp) {

               // parsing regexps

               let src_regexp = where[i].extract;
               let parsed_regexp = [];

               let extra = where[i].extract.source.replace(regExpSplitter, function ($0, $1, $2) {
                  var re = new RegExp("^" + $1 + "$");
                  if (!$2) {
                     re.min = 1;
                     re.max = 1;
                  }
                  if ($2 === '?') {
                     re.min = 0;
                     re.max = 1;
                  }
                  if ($2 === '*') {
                     re.min = 0;
                     re.max = Infinity;
                  }
                  if ($2 === '+') {
                     re.min = 1;
                     re.max = Infinity;
                  }
                  parsed_regexp.push(re);
                  return "";
               });

               if (extra) {
                  throw new Error("There is extra stuff that we don't support: " + extra);
               }

               $$$.parsed_regexp && $$$.parsed_regexp(_ => eval(_));

               where[i].extract = parsed_regexp;

               fi`распарсить regexp, сдклать поддержку [], []+ и []*, ., \s, \t \n`;

            }
            let token = "\0\1\2" + x + "\2\1\0";
            x++;
            return token;
         });
      }

      sample_to_parse.replace(/\0\1\2[0-9]+\2\1\0/g, function ($0, $1) {
         seq.push(Number($0.replace(/[\0\1\2]/g, '')));
      });
      let patterns = sample_to_parse.split(/\0\1\2[0-9]+\2\1\0/);

      for (var i = dynamic_patterns.length; i--;) {
         if (patterns[i + 1] === '') {
            patterns[i + 1] = dynamic_patterns[seq[i]];
         } else {
            patterns.splice(i + 1, 0, dynamic_patterns[seq[i]])
         }
      }

      if (patterns[0] === '') {
         patterns.shift()
      }
      return patterns;
   }

   this.root_sample_sequence = parse_sample_to_sequence(sample);

   $$$.parsed_root_sample && $$$.parsed_root_sample(_ => eval(_));

   if (options.like) {
      this.like_sequences = [];
      for (var like_sample of options.like) {
         this.like_sequences.push(parse_sample_to_sequence(like_sample, true));
      }
   }


   if (options.notLike) {
      this.not_like_sequences = [];
      for (var not_like_sample of options.notLike) {
         this.not_like_sequences.push(parse_sample_to_sequence(not_like_sample, true));
      }
      // this.like_sequences = [];
      // for(var like_sample of options.notLike) {
      //   this.like_sequences.push(parse_sample_to_sequence(like_sample, true));
      // }
   }

   $$$.parsed_like_samples && $$$.parsed_like_samples(_ => eval(_));

   // fi`также разобрать все like/notLike и превратить их в массивы, но с before и after`;
   var check_result = {
      found: true,
      length: 1,
      bypass: 1
   };

   `
    :Pattern
      :PatternPart[]
        :SubPattern[]
  
  `;

   var checkChars = (string, start_pos, rule, ltr = true) => {
      check_result.length = 0;
      check_result.found = false;
      check_result.bypass = 1;
      $$$.start_check_chars && $$$.start_check_chars(it => eval(it));
      if (rule.extract) {
         for (
            var spos = start_pos, sp = ltr ? 0 : rule.extract.length - 1, spi = 0;
            sp >= 0 && sp < rule.extract.length && spos >= 0 && spos < string.length;
            ltr ? (spos += sublength, sp++, spi++) : (spos -= sublength, sp--, spi++)
         ) {
            $$$.iterate_sp && $$$.iterate_sp(it => eval(it));
            var sublength = 0;
            for (var pos = spos; pos >= 0 && pos < string.length && rule.extract[sp].test(string[pos]) && sublength <= rule.extract[sp].max; ltr ? pos++ : pos--) {
               sublength++;
               $$$.iterate_char && $$$.iterate_char(it => eval(it));
            }
            if (sublength < rule.extract[sp].min) {
               check_result.length = 0;
               return
            }
            check_result.length += sublength;
            if (spi === 0) {
               check_result.bypass += sublength;
            }
         }
         if (!(sp in rule.extract)) {
            check_result.found = rule.value ? rule.value.indexOf(string.substring(start_pos, ltr ? start_pos + check_result.length : start_pos - check_result.length)) > -1 : true;
            if (check_result.found) {
               return
            }
         }
         check_result.length = 0;
      } else if (typeof rule.value !== 'undefined' || typeof rule === 'string') {
         var values = [];

         if (typeof rule === 'string') {
            values.push(rule);
         } else if (rule.value) {
            values.push(...rule.value);
         }

         var max_length_reached = false;
         for (var pos = start_pos, idx = 0; values.length && pos >= 0 && pos < string.length && !max_length_reached; ltr ? (pos++, idx++) : (pos--, idx++)) {
            $$$.iterate_char && $$$.iterate_char(it => eval(it));
            max_length_reached = true;
            for (var t = values.length; t--;) {
               if (idx < values[t].length) {
                  max_length_reached = false;
                  if (string[pos] !== values[t][ltr ? idx : values[t].length - idx - 1]) {
                     values.splice(t, 1);
                  } else {
                     //
                  }
               } else {
                  //
               }
            }
         }

         for (t = values.length; t--;) {
            if (idx < values[t].length) {
               values.splice(t, 1);
            }
         }
         if (values.length) {
            var value = values.reduce((r, it) => it.length > r.length ? it : r, values[0]);
            check_result.found = true;
            check_result.length = value.length;
         }
      } else if (typeof rule.fn !== 'undefined') {

         if (!ltr) {
            throw new Error('RTL direction is not supported for functions', rule);
         }
         var res = {
            continue: 1, // usually 1, or distance to jump
            found: 0, // 0 means "not found yet", 1 means "found", -1 means "report that it cannot be a value"
         };
         var last_result = '';

         for (var i = start_pos; res.continue && (i < string.length + 1); i += res.continue) {
            res.continue = 1;
            res.found = 0;
            var substr = string.substring(start_pos, i + 1);
            rule.fn(substr, res, string, start_pos, i + 1);
            if (res.found) {
               last_result = substr;
            }
         }

         if (last_result) {
            check_result.found = true;
            check_result.length = last_result.length;
         }

      } else {
         console.log('Unknown parsing rule', rule);
         throw new Error('Unknown parsing rule');
      }
   };

   this.search = function (string, start_pos = 0, ltr = true) {
      $$$.search_string && $$$.search_string(it => eval(it));
      next_char:
         for (var pos = start_pos; pos >= 0 && pos < string.length; ltr ? pos += bypass : pos -= bypass) {
            $$$.iterate_pos && $$$.iterate_pos(it => eval(it));
            var bypass = 1;
            var offset = 0;
            for (var pp = ltr ? 0 : this.root_sample_sequence.length - 1, ppi = 0; pp >= 0 && pp < this.root_sample_sequence.length; ppi++, ltr ? pp++ : pp--) {
               $$$.iterate_pp && $$$.iterate_pp(it => eval(it));
               checkChars(string, ltr ? pos + offset : pos - offset, this.root_sample_sequence[pp], ltr);
               $$$.return_check_chars && $$$.return_check_chars(it => eval(it));
               if (check_result.found) {
                  if (this.root_sample_sequence[pp].name) {
                     this.root_sample_sequence[pp].found = string.substring(ltr ? pos + offset : pos - offset, ltr ? pos + offset + check_result.length : pos - offset - check_result.length);
                  }
                  offset += check_result.length;
                  if (ppi === 0) {
                     bypass = check_result.bypass;
                  }
               } else {
                  this.root_sample_sequence.map(it => delete it.found);
                  continue next_char;
               }
            }

            var s = string.substring(pos, ltr ? pos + offset : pos - offset), result = {
               result: s,
               lpos: ltr ? pos : pos - (s.length - 1),
               rpos: ltr ? pos + (s.length - 1) : pos,
               length: s.length
            };
            result.pos = result.lpos;

            let like_found = false;
            if (options.like) {
               // if(options.like || options.notLike){
               iterate_likes:
                  for (var i = 0; i < this.like_sequences.length; i++) {
                     let seq = this.like_sequences[i];
                     if (!seq.left_idx || !seq.right_idx) {
                        let root_idx = seq.indexOf(root_sample);
                        seq.left_idx = root_idx - 1;
                        seq.right_idx = root_idx + 1;
                     }
                     var lpos = result.lpos - 1, substring_length;
                     check_result.found = null;
                     for (var idx = seq.left_idx; idx >= 0 && lpos >= 0; idx--, lpos -= substring_length) {
                        checkChars(string, lpos, seq[idx], false);
                        if (!check_result.found) {
                           continue iterate_likes;
                        }
                        substring_length = check_result.length;
                     }
                     if (check_result.found || (check_result.found === null && seq.left_idx === -1) && lpos === -1) {
                        lpos = 0;
                     }
                     var rpos = result.rpos + 1;
                     check_result.found = null;
                     for (var idx = seq.right_idx; idx < seq.length && rpos < string.length; idx++, rpos += substring_length) {
                        checkChars(string, rpos, seq[idx]);
                        if (!check_result.found) {
                           continue iterate_likes;
                        }
                        substring_length = check_result.length;
                     }
                     if (check_result.found || (check_result.found === null && seq.left_idx === seq.length) && rpos >= string.length) {
                        rpos = string.length - 1;
                     }
                     if (lpos >= 0 && rpos < string.length) {
                        like_found = true;
                        if (options.like) {
                           break
                        }
                     }
                  }

               if (!like_found) {
                  continue next_char;
               }
            }

            if (options.notLike) {
               iterate_likes:
                  for (var i = 0; i < this.not_like_sequences.length; i++) {
                     let seq = this.not_like_sequences[i];
                     if (!seq.left_idx || !seq.right_idx) {
                        let root_idx = seq.indexOf(root_sample);
                        seq.left_idx = root_idx - 1;
                        seq.right_idx = root_idx + 1;
                     }
                     var lpos = result.lpos - 1, substring_length;
                     check_result.found = null;
                     for (var idx = seq.left_idx; idx >= 0 && lpos >= 0; idx--, lpos -= substring_length) {
                        checkChars(string, lpos, seq[idx], false);
                        if (!check_result.found) {
                           continue iterate_likes;
                        }
                        substring_length = check_result.length;
                     }
                     if (check_result.found || (check_result.found === null && seq.left_idx === -1) && lpos === -1) {
                        lpos = 0;
                     }
                     var rpos = result.rpos + 1;
                     check_result.found = null;
                     for (var idx = seq.right_idx; idx < seq.length && rpos < string.length; idx++, rpos += substring_length) {
                        checkChars(string, rpos, seq[idx]);
                        if (!check_result.found) {
                           continue iterate_likes;
                        }
                        substring_length = check_result.length;
                     }
                     if (check_result.found || (check_result.found === null && seq.left_idx === seq.length) && rpos >= string.length) {
                        rpos = string.length - 1;
                     }

                     if (lpos >= 0 && rpos < string.length) {
                        continue next_char;
                     }
                  }
            }

            this.root_sample_sequence.map(it => it.name && (result[it.name] = it.found));
            $$$.finish_search && $$$.finish_search();
            return result;
         }
   };

   var regenerator;

   this.translator = (re_sample, rg_options = {}) => {

      var _options = {};

      // console.log('options.where', where);
      _options[re_sample] = {fill: "value."};
      _options[sample] = {fill: "result"};
      for (var i in where) {
         _options[i] = {
            fill: where[i].name
         }
      }
      // console.log('regenerator', re_sample, _options);

      regenerator = new ReGenerator(_options);


      // ni('взять код от ReGenerator и захуячить на выходе. только протащить еще SpEx (np, будет в this)');

      this.translate = (text, additional_vars = null, num_occurences = Infinity, pos = 0) => {

         let result;

         while (result = this.search(text, pos)) {
            let subst = regenerator.generate({value: result});
            // console.log('text was', text);
            text = text.substr(0, result.lpos) + subst + text.substr(result.rpos + 1);
            //console.log('text became', text);
            pos = rg_options.recursive ? result.lpos + 1 : result.lpos + subst.length;
         }

         // return regenerator.generate(text);
         // ni('запустить ReGenerator');
         return text

      };
      return this
   };


   return this;
};


`

получить работающий SpEx
<- имплементировать посимвольный перебор в поиске
   <- поиск всех значений
<- имплементировать создание трансформатора 0.5h
   # просто переделать слегка ReGenerator
<- имплементировать генерацию выходного шаблона 0.5h
   <- сделать запуск парсинга исходного текста. если исходник пустой, на выходе - пустой шаблон.
   <- сделать соединение переменных

методы:
- checkNextCharsAndFireMatchEvents()
   on Event_FirstCharMatch, Event_SubPatternMatch
- resetCursors
   on Event_SubPatternNotMatch
- checkLikeOrNot
   on Event_FoundFullPositiveMatch
- 



essdtimate.fifsnish=06:01
`;

aop && aop.test(function() {
   console.log();
   var code = `
   // x
   return z/5`;
   spexpr = new SpEx(
      "/ divider_expression",
      {
         notLike: [
            '*/ divider_expression',
            '// divider_expression',
         ],
         where: {
            " ": {extract: /\s*/},
            "divider_expression": {
               name: 'divider_expression', fn: (substr, res, string, begin_pos, end_pos) => {

                  // console.log('try divider', substr);
                  // console.log('kuku',JSON.stringify(substr), JSON.stringify(string.substring(begin_pos, end_pos)), string[end_pos], '+-*/^,%;?:'.indexOf(string[end_pos]) > -1);

                  // if (string.substr(end_pos, 2) === '//') {
                  //    res.continue = false;
                  //    return
                  // }

                  if(substr === '"' || substr === "'") {
                     res.continue = false;
                  }
                  try {
                     new Function("(()=> 5 + " + substr + ')');
                     res.found = 1;
                     // console.log('kuku',JSON.stringify(substr), JSON.stringify(string.substring(begin_pos, end_pos)), string[end_pos], '+-*/^,%;?:'.indexOf(string[end_pos]) > -1);
                     if ('+-*/^,%;?:'.indexOf(string[end_pos]) > -1) {
                        // console.log('zuzu',substr, string[end_pos], '+-*/^,%;?:'.indexOf(string[end_pos]) > -1);
                        res.continue = false;
                     }
                  } catch (e) {
                     // console.log('wrong iteration ', e)
                  }
               }
            }
         }
      }
   );
   var x = spexpr.search(code);
   console.log('found result', x);
});

// aop && aop.test(function() {
//    console.log();
//    var code = 'Close_(row)';
//    var spexpr = new SpEx(
//       "linked_table_colname",
//       {
//          like: [
//             "linked_table_colname(",
//             "linked_table_colname (",
//          ],
//          notLike: [
//             ".linked_table_colname",
//             "Xlinked_table_colname",
//          ],
//          where: {
//             " ": {extract: /\s+/},
//             "X": {extract: /[A-Za-z0-9]/},
//             "linked_table_colname": {extract: /[a-zA-Z0-9$_]+/, value: ['Close_', 'Open_']}
//          }
//       }
//    );
//    var x = spexpr.search(code);
//    console.log('found result', x);
// });
//
//
// aop && aop.test(function() {
//   console.log();
//   var code = '7 + B1 + rowCount';
//   var spexpr = new SpEx(
//     "rowCount",
//     {
//       notLike: [
//         '.rowCount',
//         'rowCount.',
//         'rowCount(',
//         'rowCount (',
//         'XrowCount',
//         'rowCountX',
//       ],
//       where: {
//         " ": {extract: /\s+/},
//         "X": {extract: /[a-zA-Z0-9$_]+/},
//       }
//     }
//   );
//   var x = spexpr.search(code);
//   console.log('found result', x);
// });

// aop && aop.test(function() {
//   console.log();
//   var code = 'rowCount';
//   var spexpr = new SpEx(
//     "rowCount",
//     {
//       notLike: [
//         '.rowCount',
//         'rowCount.',
//         'rowCount(',
//         'rowCount (',
//         'XrowCount',
//         'rowCountX',
//       ],
//       where: {
//         " ": {extract: /\s+/},
//         "X": {extract: /[a-zA-Z0-9$_]+/},
//       }
//     }
//   );
//   var x = spexpr.search(code);
//   console.log('found result', x);
// });



// aop && aop.test(function() {
//   console.log();
//   console.log("# search for", "xxx:yyy", 'aaa', 'bbb', 'aaa:bbb');
//   var spexpr = new SpEx(
//     "xxx:yyy",
//     {
//       where: {
//         "xxx" : { value: ['aaa'] }, // только классы символов и квантификаторы
//         "yyy" : { value: ['bbb'] },
//       }
//     }
//   );
//   var x = spexpr.search("aaa:bbb");
//   console.log('found result', x);
// });


// aop && aop.test.repeat({
//   "aaa:bbb" : "sdfjs dsioj:fsj siodj sdj ios",
//   "aaa"     : "dsioj",
//   "bbb"     : "fsj",
// }, it=> eval(it));

// aop && aop.test(function() {
//
//   var spexpr = new SpEx(
//     "aaa:bbb",
//     {
//       where: {
//         "aaa" : { value: ['aaa'] }, // только классы символов и квантификаторы
//         "bbb" : { value: ['bbb'] },
//       }
//     }
//   );
//
//   var x = spexpr.search(" _d  ij s _o iqw oq _t_bl1:col1 aaa:bbb soid _t_bl2:col3 (_t_bl3:col3)  sdfsd _t_bl4:col4 //_t_bl5:col5  oe wioe oiw");
//
//   console.log(x);
//
//
//   var spexpr = new SpEx(
//     "tablename:colname",
//     {
//       notLike: [
//         "'tablename:colname'",
//         "(tablename:colname)",
//         "//tablename:colname",
//         "asd//tablename:colname[zzz]",
//       ],
//       where: {
//         "tablename" : { name: "table_name"  , extract: /_[a-zA-Z$_],[a-zA-Z0-9$_]*/ }, // только классы символов и квантификаторы
//         "colname"   : { name: "column_name" , value: ["col1", "col3"] },
//         "asd"       : { name: "some_key"    , extract: /[a-zA-Z$_]+/ },
//       }
//     }
//   );
//
//   let m;
//   var x = spexpr.search(m = " _ada  aij as _ao iqw oq '_t,bl1:col1' soid _t,bl2:col3 (_t,bl3:col3)  sdfsd //_t,bl5:col5 dwd//_t,bl5:col5 oe wioe _t,bl4:col1 oiw");
//   console.log(x);
//   var z = x.rpos;
//   var x = spexpr.search(m, z);
//
//   console.log(x);
//
//
//
//   // spexpr.translate("hupa-zupa");
//
//   var spexpr = new SpEx(
//     "colname",
//     {
//       notLike: [
//         ":colname",
//         "colname(",
//         "colname (",
//         // "wrongTableName.colname",
//       ],
//       where: {
//         "colname": { extract: /[a-zA-Z0-9$_]+/, value: [ 'co1l', 'col2', 'col3' ] }, // только классы символов и квантификаторы
//         " ": {extract: /\s+/},
//         "zuzu": { _: "root" },
//         // "wrongTableName": { _: "table", fn_check: function({root, table}) { return tables[table][root] } }
//       }
//     }
//   )
//     .translator("colname(n)");
//   let translate_result = spexpr.translate(" console.log(col1(m), col2, col3)");
//
//   console.log('translate_result', translate_result);
//
//   console.log(spexpr.search('dsf dsf dsf:col3'));
//
//   // spexpr.translate("hupa-zupa");
//
//   // var spexpr = new SpEx(
//   //   "/division_expression",
//   //   {
//   //     notLike: [
//   //       "/*",
//   //       "//",
//   //       "/_check_divider(",
//   //       "[invalid_context]/_check_divider(",
//   //     ],
//   //     where: {
//   //       "division_expression": { fn_check: {} }, // только классы символов и квантификаторы
//   //       " ": {extract: /\s+/},
//   //       "[invalid_context]": { /* check that we are not in comment or string */}
//   //     }
//   //   }
//   // ).translator("colname(n)", {
//   //   "": {
//   //
//   //   }
//   // });
//   //
//   // spexpr.translate("hupa-zupa");
//
// });


function ni(descr) {
   throw new Error("Not fully implemented: " + descr);
}

function fi() {
}

function pni(descr) {
   if (!pni[descr]) {
      pni[descr] = true;
      console.warn(new Error("Warning - not fully implemented: " + descr).stack);
   }
}

function sb(descr, ...args) {
   throw new Error("Strange behaviour: " + descr + (args && args.length ? JSON.stringify(args) : ""));
}

