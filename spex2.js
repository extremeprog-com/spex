

process spex2 {
  
  
  search(string) {
    
    run process find_first_letter() {
      
      for(var i = 0; i < string.length; i++) {
        
        var match = checkChar(string[i]);
        
        if(match) {
          emit find_first_letter.found(pos);
          let event = wait validate_pattern_part.match, validate_pattern_part.notMatch;
          if(event instanceof validate_pattern_part.match) {
          
          }
        }
      }
      
    }
    
    
    run process validate_pattern_parts() {
      
      let event = wait find_first_letter.match, validate_subpattern.match, validate_subpattern.notMatch;
      
    }
    
    
    run process validate_subpattern() {
    
    }
    
    
    
  }
  
  
  
}



