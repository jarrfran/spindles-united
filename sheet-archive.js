/* Read-only Google Sheets connection. Only the match, goal/assist and card logs drive the schedule. */
(function(root){
  'use strict';
  var ID='1DAeHMhkPNmIEMFssGc29kkfBgPj4POKOChNVtUO-tJg',URL='https://docs.google.com/spreadsheets/d/'+ID+'/edit';
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function text(v){return v==null?'':String(v).trim();}
  function present(v){return !['','—','–','-','n/a','none'].includes(text(v).toLowerCase());}
  function number(v){return v!==null&&v!==undefined&&text(v)!==''&&Number.isFinite(Number(v))?Number(v):null;}
  function date(v){
    var s=text(v),g=s.match(/^Date\((\d+),(\d+),(\d+)/);
    if(g)return g[1]+'-'+String(+g[2]+1).padStart(2,'0')+'-'+String(+g[3]).padStart(2,'0');
    return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(new Date(s+'T12:00:00').getTime())?s:null;
  }
  function minute(v){if(!present(v))return null;var s=text(v).replace(/[’'′\s]/g,'');return /^\d{1,3}(?:\+\d{0,2})?$/.test(s)?s:null;}
  function minuteOrder(v){if(v==null)return 10000;var p=v.split('+');return +p[0]+(p.length>1?(p[1]?+p[1]:.5):0);}
  function key(s){s=text(s).toLowerCase().replace(/[^a-z0-9]/g,'');return ({unitedsoccergroup:'usg',sacandagalakerssc:'lakers',sacandagalakers:'lakers',patroonunited:'patroon',mohawkcityfc:'mohawkcity',collarcityfc:'collarcity',highlandersfc:'highlanders',backheelfc:'backheel',spindlesunitedfc:'spindles'})[s]||s;}
  function matchKey(year,d,opponent){return year+'|'+d+'|'+key(opponent);}
  function safeLink(s){s=text(s);return /^https?:\/\//i.test(s)||/^\/(?!\/)/.test(s)?s:null;}
  function merge(base,tables){
    if(!tables.matches.length||!tables.goals.length||!tables.cards.length)throw new Error('Incomplete archive response');
    var out=clone(base),old={},crests={},labels={},used={},goalsBy={},cardsBy={},matches=[],issues=[],seasons={};
    Object.keys(base.schedules).forEach(function(y){base.schedules[y].matches.forEach(function(m){
      var sp=m.home==='Spindles'?'home':'away',op=sp==='home'?'away':'home';old[matchKey(y,m.date,m[op])]=m;
      crests[key(m[op])]=m[op+'Crest'];labels[key(m[op])]=m[op];
    });});
    tables.goals.forEach(function(row){var y=number(row.Season),d=date(row.Date);if(!y||!d||!present(row.Scorer))return;var k=matchKey(y,d,row.Opponent);(goalsBy[k]||(goalsBy[k]=[])).push(row);});
    tables.cards.forEach(function(row){var y=number(row.Season),d=date(row.Date);if(!y||!d||!present(row.Player))return;var k=matchKey(y,d,row.Opponent);(cardsBy[k]||(cardsBy[k]=[])).push(row);});
    tables.matches.forEach(function(row){
      var y=number(row.Season),d=date(row.Date),opponent=text(row.Opponent);
      if(!Number.isInteger(y)||y<2000||y>2100||!d||!opponent)return;
      if(+d.slice(0,4)!==y)throw new Error('Season/date mismatch: '+d);
      var k=matchKey(y,d,opponent);if(used[k])throw new Error('Duplicate match: '+d+' '+opponent);used[k]=true;
      var original=old[k],m=original?clone(original):{},sp=text(row['H/A']).toUpperCase()==='A'?'away':'home',op=sp==='home'?'away':'home';
      var gf=number(row.GF),ga=number(row.GA),ha=text(row['H/A']).toUpperCase(),stage=text(row.Stage),competition=text(row.Competition);
      if((gf!=null&&(gf<0||gf>100))||(ga!=null&&(ga<0||ga>100)))throw new Error('Invalid score: '+d);
      delete m.report;delete m.reportTitle;
      m.date=d;m.id=m.id||d;m.home=sp==='home'?'Spindles':labels[key(opponent)]||opponent;m.away=sp==='away'?'Spindles':labels[key(opponent)]||opponent;
      m[sp+'Score']=gf;m[op+'Score']=ga;m[sp+'Crest']=base.crest;m[op+'Crest']=crests[key(opponent)]||'';
      m.competition=competition+(stage?' '+stage.replace(/^MW(\d+)/,'Matchweek $1'):'');m.stage=stage;m.league=competition;
      m.homeAway=ha==='N'?'Neutral':ha==='A'?'Away':'Home';m.manOfMatch=present(row['Man of the Match'])?text(row['Man of the Match']):null;
      m.kickoff=present(row.Kickoff)?text(row.Kickoff):(m.kickoff||'');m.venue=present(row.Venue)?text(row.Venue):(m.venue||(competition==='CDSL'?'Nott Road Park':''));
      m.recapUrl=safeLink(row['Recap URL'])||m.recapUrl||null;m.video=safeLink(row['Stream URL'])||m.video||null;m.photos=m.photos||[];
      m.forfeit=/forfeit/i.test(stage);m.result=present(row.Result)?text(row.Result).toUpperCase():(gf==null||ga==null?'TBD':gf===ga?'D':gf>ga?'W':'L');
      if(m.forfeit)m.note='Win by forfeit · not played';
      else if(original&&/forfeit/i.test(original.note||''))m.note='';
      var pf=number(row['Pens For']),pa=number(row['Pens Against']);
      if(pf!=null&&pa!=null)m.note='Pens '+pf+'-'+pa;
      m.winner=m.result==='W'?sp:m.result==='L'?op:null;
      if(!m.winner&&gf===ga&&/^Pens /.test(m.note||'')){var pens=m.note.match(/(\d+)-(\d+)/);if(pens&&+pens[1]!==+pens[2])m.winner=+pens[1]>+pens[2]?sp:op;}
      // Preserve 2026 opponent events, assigning sides by team identity after H/A changes.
      var events=[],opponentCoverage=false;
      if(original&&(original.opponentEvents||original.eventCoverage==='both-teams')){
        var oldSp=original.home==='Spindles'?'home':'away',oldOp=oldSp==='home'?'away':'home';opponentCoverage=true;
        (original.opponentEvents||original.events.filter(function(e){return e.side===oldOp;})).forEach(function(e){var copy=clone(e);copy.side=op;if(copy.playerSide)copy.playerSide=copy.playerSide===oldSp?sp:op;delete copy.homeScore;delete copy.awayScore;events.push(copy);});
      }
      m.opponentEvents=opponentCoverage?clone(events):null;
      var goalRows=goalsBy[k]||[],cardRows=cardsBy[k]||[];
      if(!m.forfeit)goalRows.forEach(function(g){var own=/own goal/i.test(text(g.Type)+' '+text(g.Scorer));events.push({minute:minute(g.Min),type:'goal',side:sp,player:text(g.Scorer),assist:present(g.Assist)?text(g.Assist):null,note:/^(Penalty|Free kick)$/i.test(text(g.Type))?text(g.Type):null,ownGoal:own,playerSide:own?op:sp,source:'Club Goal & Assist Log'});});
      cardRows.forEach(function(c){var type=text(c.Card).toLowerCase();if(type!=='yellow'&&type!=='red'){issues.push(d+': unrecognized card '+text(c.Card));return;}events.push({minute:minute(c.Min),type:type,side:sp,player:text(c.Player),number:number(c['No.']),code:present(c.Code)?text(c.Code):null,offence:present(c.Offence)?text(c.Offence):null,source:'Club Discipline Log'});});
      events.sort(function(a,b){return minuteOrder(a.minute)-minuteOrder(b.minute)||({goal:0,yellow:1,red:2}[a.type]-{goal:0,yellow:1,red:2}[b.type]);});
      var spGoals=events.filter(function(e){return e.type==='goal'&&e.side===sp;}).length,opGoals=events.filter(function(e){return e.type==='goal'&&e.side===op;}).length;
      var complete=opponentCoverage&&spGoals===gf&&opGoals===ga&&!events.some(function(e){return e.type==='goal'&&e.minute==null;});
      if(complete){var counts={home:0,away:0};events.forEach(function(e){if(e.type==='goal'){counts[e.side]++;e.homeScore=counts.home;e.awayScore=counts.away;}});}
      if(!m.forfeit&&gf!=null&&spGoals!==gf)issues.push(d+': '+spGoals+' scorer entries for '+gf+' goals');
      m.events=events;m.eventCoverage=complete?'both-teams':'spindles-events';m.eventSource='Club archive spreadsheet';m.eventCountNote=(!m.forfeit&&gf!=null&&spGoals!==gf)?'Some Spindles scorer details are not recorded yet.':null;
      m.scheduleUrl='/schedule?season='+y+'#match-'+m.id;m.sheetKey=k;m.sheetSeason=y;matches.push(m);
      if(!seasons[y])seasons[y]={source:'/schedule?season='+y,summary:'',finish:'',matches:[]};seasons[y].matches.push(m);
    });
    if(!matches.length)throw new Error('No valid match records');
    // The archive intentionally excludes the unplayed 2025 no-contest from its statistics.
    Object.keys(old).forEach(function(k){var m=old[k];if(m.result==='NC'&&!used[k]){var y=+m.date.slice(0,4);if(seasons[y])seasons[y].matches.push(clone(m));}});
    Object.keys(seasons).forEach(function(y){var s=seasons[y],regular=s.matches.filter(function(m){return /^MW\d+/i.test(m.stage||'')&&m.result!=='NC';});var w=0,draw=0,l=0;regular.forEach(function(m){if(m.result==='W')w++;else if(m.result==='D')draw++;else if(m.result==='L')l++;});s.summary='Regular Season Record ('+w+'-'+draw+'-'+l+')';
      var final=s.matches.find(function(m){return /^Final$/i.test(m.stage||'')&&m.league!=='Grassroots Cup';});
      s.finish='Post Season Finish: '+(final?(final.winner&&final[final.winner]==='Spindles'?'Champions':'Finalists'):s.matches.some(function(m){return /semi/i.test(m.stage||'');})?'Semi-Finalists':s.matches.some(function(m){return /playoff/i.test(m.stage||'');})?'Playoff Round 1':'Season in progress');s.matches.sort(function(a,b){return a.date.localeCompare(b.date);});
    });
    out.schedules=seasons;out.currentSeason=Math.max.apply(null,Object.keys(seasons).map(Number));
    out.scheduleNotes={archives:'Spindles goals, assists and disciplinary events follow the club archive. Opponent events are included where league reports are available; unrecorded minutes are shown as —.'};
    out.sheetSync={url:URL,checkedAt:new Date().toISOString(),status:'live',matches:matches.length,goals:tables.goals.filter(function(g){return date(g.Date)&&present(g.Scorer);}).length,cards:tables.cards.filter(function(c){return date(c.Date)&&present(c.Player);}).length,issues:issues};
    return out;
  }
  function records(response,required){
    if(!response||response.status!=='ok'||!response.table)throw new Error('Archive unavailable');
    var cols=response.table.cols.map(function(c){return text(c.label);});required.forEach(function(c){if(cols.indexOf(c)<0)throw new Error('Missing archive column '+c);});
    return response.table.rows.map(function(row){var o={};cols.forEach(function(c,i){if(c)o[c]=row.c[i]?row.c[i].v:null;});return o;});
  }
  function query(sheet,range,required){return new Promise(function(resolve,reject){
    var name='suSheet'+Math.random().toString(36).slice(2),script=document.createElement('script'),timer;
    function clear(){clearTimeout(timer);script.remove();delete root[name];}
    root[name]=function(data){try{var rows=records(data,required);clear();resolve(rows);}catch(e){clear();reject(e);}};
    script.src='https://docs.google.com/spreadsheets/d/'+ID+'/gviz/tq?'+new URLSearchParams({sheet:sheet,range:range,headers:'1',tqx:'out:json;responseHandler:'+name+';reqId:'+Date.now(),tq:'select * where A is not null'}).toString();
    script.onerror=function(){clear();reject(new Error('Could not read club archive'));};timer=setTimeout(function(){clear();root[name]=function(){};setTimeout(function(){delete root[name];},60000);reject(new Error('Club archive timed out'));},15000);document.head.appendChild(script);
  });}
  var cached=null,loaded=0,pending=null,lastTables=null;
  function load(base,force){
    if(pending)return pending;if(!force&&cached&&Date.now()-loaded<300000)return Promise.resolve(cached);
    pending=Promise.all([query('Match Log','A4:Z',['Season','Date','Opponent','GF','GA']),query('Goal & Assist Log','A4:G',['Season','Date','Min','Scorer','Assist','Opponent']),query('Discipline Log','A4:I',['Season','Date','Min','Player','Card','Opponent'])]).then(function(values){lastTables={matches:values[0],goals:values[1],cards:values[2]};cached=merge(base,lastTables);loaded=Date.now();return cached;}).catch(function(){var fallback=clone(cached||base);fallback.sheetSync=fallback.sheetSync||{};fallback.sheetSync.status='snapshot';return fallback;}).finally(function(){pending=null;});return pending;
  }
  var api={merge:merge,load:load,records:records,query:query,getTables:function(){return lastTables;}};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SUSheetArchive=api;
})(typeof window!=='undefined'?window:globalThis);
