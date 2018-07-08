
DB.get("Process_id");

Process();




/*
$Company.businessProcesses[].$BusinessProcess.performance {
  type: scale [none -> bad -> good -> perfect];
  follow +$BusinessProcess.Roles[].$Manager.Quality;
  follow +$BusinessProcess.Roles[].$Manager.Performance evaluator $Company.Roles[].Owner; // показатель собирается
  follow +$BusinessProcess.Roles[].$Manager.TimePerWeek evaluator function() {}; // показатель вычисляется
}

*/

/*

actor  {
  $BusinessProcess.Roles[].$Manager (
    evaluate Performance by $Company.Roles[].Owner {}
    expect "good"
  )
}

*/