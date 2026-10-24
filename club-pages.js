/* Spindles expandable schedule and roster archives. All content is sourced in data/club.json. */
(function () {
  var BASE = new URL('.', document.currentScript.src).href;
  var dataReady;
  function getData() {
    if (!dataReady) dataReady = fetch(BASE + 'data/club.json?v=' + Math.floor(Date.now()/120000)).then(function(r){if(!r.ok)throw new Error('Could not load club data');return r.json();});
    return dataReady;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function date(s, long) { return new Date(s+'T12:00:00').toLocaleDateString('en-US',long?{weekday:'long',month:'long',day:'numeric',year:'numeric'}:{month:'short',day:'numeric'}); }
  function logo(src,name) {return src?'<img src="'+esc(src)+'?format=100w" alt="" width="32" height="32">':'<span class="su-team-placeholder" aria-hidden="true">'+esc(name.charAt(0))+'</span>';}
  function score(m) {return '<span class="su-club-score"><span>'+esc(m.homeScore==null?'–':m.homeScore)+'</span><i aria-hidden="true"></i><span>'+esc(m.awayScore==null?'–':m.awayScore)+'</span></span>';}
  function teams(m) {return '<span class="su-club-match-teams"><span class="su-club-team su-club-team-home"><span>'+esc(m.home)+'</span>'+logo(m.homeCrest,m.home)+'</span>'+score(m)+'<span class="su-club-team">'+logo(m.awayCrest,m.away)+'<span>'+esc(m.away)+'</span></span></span>';}
  function query(season,match) {return '?season='+season+(match?'&match='+encodeURIComponent(match):'');}
  function header(type,year,years,current,match) {
    var title=type==='schedule'?'Matches & results.':'Meet the Spins.';
    return '<div class="su-club-hero"><div class="su-club-wrap su-club-heading"><div><p class="su-club-eyebrow">Spindles United FC / '+(year===current?'Current season':'Season archive')+'</p><h1 tabindex="-1">'+title+'</h1><p>'+ (type==='schedule'?'Every match. Every season. Follow the Spins.':'The players behind the crest. Our club, past and present.')+'</p></div><label class="su-season-picker">Season<select data-season aria-label="Choose '+type+' season">'+years.map(function(y){return '<option value="'+y+'"'+(String(y)===String(year)?' selected':'')+'>'+y+(+y===current?' · Current':'')+'</option>';}).join('')+'</select></label></div></div>';
  }
  function chevron() {return '<svg class="su-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m8 3 9 9-9 9-4-4 5-5-5-5z"/></svg>';}
  function eventPerson(e,m) {
    var side=e.playerSide||e.side,name=e.player||e.detail||'',note=e.note||'';
    if(e.ownGoal)note=(note?note+' · ':'')+'Own goal';
    if(e.number)note=(note?note+' · ':'')+'#'+e.number;
    return '<div class="su-timeline-person"><span class="su-timeline-name"><b>'+esc(name)+'</b>'+(note?'<small>'+esc(note)+'</small>':'')+'</span>'+logo(m[side+'Crest'],m[side])+'<time>'+esc(e.minute)+'′</time></div>';
  }
  function timeline(m,year) {
    var events=m.events||[],full=m.eventCoverage==='both-teams';
    var note=full?'Goals and cards follow the 2026 league match report. Details may differ from the club recap.':'Spindles scorers only. Opponent scoring times and disciplinary events are not recorded in this archive.';
    if(!events.length){var spGoals=m.home==='Spindles'?m.homeScore:m.awayScore;return '<section class="su-match-events su-timeline"><h3>Match events</h3><p class="su-empty-note">'+(m.result==='NC'?'This match was recorded as no contest.':spGoals===0?'No Spindles goals in this match.':'Scorer details were not published for this fixture.')+'</p><p class="su-timeline-note">'+esc(note)+'</p></section>';}
    return '<section class="su-match-events su-timeline" aria-label="Match events for '+esc(m.home+' vs '+m.away)+'"><h3>Match events</h3><div class="su-timeline-teams"><span>Home · '+esc(m.home)+'</span><span></span><span>Away · '+esc(m.away)+'</span></div><ol class="su-timeline-list">'+events.map(function(e){
      var goal=e.type==='goal',badge=goal?(full?'<span class="su-timeline-score" aria-label="Score '+e.homeScore+' to '+e.awayScore+'">'+e.homeScore+' : '+e.awayScore+'</span>':'<span class="su-timeline-goal" aria-label="Goal">⚽</span>'):'<span class="su-timeline-card" aria-label="'+(e.type==='red'?'Red':'Yellow')+' card"><i class="su-card-'+esc(e.type)+'" aria-hidden="true"></i></span>';
      return '<li class="su-timeline-row su-event-'+esc(e.type)+'"><div class="su-timeline-side su-timeline-home">'+(e.side==='home'?eventPerson(e,m):'')+'</div><div class="su-timeline-marker">'+badge+'</div><div class="su-timeline-side su-timeline-away">'+(e.side==='away'?eventPerson(e,m):'')+'</div></li>';
    }).join('')+'</ol><p class="su-timeline-note">'+esc(note)+'</p></section>';
  }
  function matchDetails(m,year) {
    var links=(m.recapUrl?'<a class="su-club-btn" href="'+esc(m.recapUrl)+'">Match recap '+chevron()+'</a>':'')+(m.video?'<a class="su-club-btn su-stream-btn" href="'+esc(m.video)+'" target="_blank" rel="noopener"><svg class="su-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3v18l15-9z"/></svg>Watch stream</a>':'');
    var photos=m.photos||[];
    return '<div class="su-fixture-detail"><div class="su-fixture-detail-top"><div><h3>'+esc(m.competition)+'</h3><p>'+esc(date(m.date,true))+' · '+esc(m.kickoff||'Time not recorded')+'</p><p>'+esc(m.venue||'Venue not recorded')+'</p><p>'+esc(m.result==='NC'?'No contest':'Full time')+(m.note&&m.note!=='No contest'?' · '+esc(m.note):'')+'</p></div>'+(links?'<div class="su-match-links">'+links+'</div>':'')+'</div>'+timeline(m,year)+(photos.length?'<details class="su-fixture-photos"><summary>Match photos <span>'+photos.length+'</span><i class="su-disclosure-icon" aria-hidden="true"></i></summary><div class="su-match-gallery">'+photos.map(function(u,i){return photo(u,i,m);}).join('')+'</div></details>':'')+'</div>';
  }
  function scheduleList(d,year,openMatch) {
    var season=d.schedules[year],matches=season.matches.slice().sort(function(a,b){return b.date.localeCompare(a.date);}),month='';
    return '<div class="su-club-main"><div class="su-club-wrap"><div class="su-club-season-facts"><div><small>Season</small><b>'+year+'</b></div><div><small>Regular season</small><b>'+esc(season.summary.replace('Regular Season Record ',''))+'</b></div><div><small>Postseason</small><b>'+esc(season.finish.replace('Post Season Finish: ',''))+'</b></div></div><div class="su-club-list-heading"><h2>'+year+' fixtures & results</h2><p>Select a match for details · All times Eastern</p></div>'+matches.map(function(m){
      var md=m.date.slice(0,7),heading='',weekday=new Date(m.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'});
      if(md!==month){month=md;heading='<h3 class="su-match-month">'+new Date(m.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</h3>';}
      return heading+'<details class="su-match-dropdown" id="match-'+esc(m.id)+'"'+(m.id===openMatch?' open':'')+'><summary class="su-fixture"><span class="su-fixture-date"><span class="su-fixture-weekday">'+esc(weekday)+'</span><b>'+esc(date(m.date))+'</b><small>'+esc(m.kickoff||'Time not recorded')+'</small></span><span class="su-fixture-center"><span class="su-fixture-comp">'+esc(m.competition)+(m.note?' · '+esc(m.note):'')+'</span>'+teams(m)+'<span class="su-fixture-place">'+esc(m.venue||'Venue not recorded')+'</span></span><span class="su-fixture-action"><span class="su-res su-res-'+(m.result==='W'?'w':m.result==='L'?'l':'d')+'">'+esc(m.result)+'</span><span class="su-fixture-toggle-label">Match details</span><i class="su-disclosure-icon" aria-hidden="true"></i></span></summary>'+matchDetails(m,year)+'</details>';
    }).join('')+'<p class="su-club-source">'+esc(d.scheduleNotes&&d.scheduleNotes[year]||d.scheduleNotes.archives)+'</p></div></div>';
  }
  function photo(u,i,m) {return '<a href="'+esc(u)+'" target="_blank" rel="noopener" aria-label="Open match photo '+(i+1)+'"><img src="'+esc(u)+'?format=750w" loading="lazy" alt="'+esc(m.home+' vs '+m.away+', match photo '+(i+1))+'"></a>';}
  function rosterGrid(d,year,search,group) {
    var list=d.rosters[year].players.filter(function(p){return (!group||p.group===group)&&(!search||(p.name+' '+p.bio+' '+(p.number||'')).toLowerCase().includes(search.toLowerCase()));});
    var groups=[];list.forEach(function(p){if(groups.indexOf(p.group)<0)groups.push(p.group);});
    return '<p class="su-roster-count" role="status">'+list.length+' '+(list.length===1?'person':'people')+' in the '+year+' archive</p>'+(list.length?groups.map(function(g){return '<section class="su-roster-group"><h2>'+esc(g)+'</h2><div class="su-roster-grid">'+list.filter(function(p){return p.group===g;}).map(function(p){return '<article class="su-roster-card"><div class="su-roster-photo"><img src="'+esc(p.photo)+'?format=750w" loading="lazy" alt="'+esc(p.name)+'">'+(p.number?'<span class="su-roster-number" aria-label="Squad number '+esc(p.number)+'">'+esc(p.number)+'</span>':'')+'</div><div class="su-roster-card-copy"><h3>'+esc(p.name)+'</h3>'+(p.bio?'<p>'+esc(p.bio)+'</p>':'')+'</div></article>';}).join('')+'</div></section>';}).join(''):'<p class="su-empty-note">No players match your search. Try another name or clear the filters.</p>');
  }
  function roster(d,year,search,group) {
    var groups=[];d.rosters[year].players.forEach(function(p){if(groups.indexOf(p.group)<0)groups.push(p.group);});
    return '<div class="su-club-main"><div class="su-club-wrap"><div class="su-roster-toolbar"><label>Find a player<input type="search" data-search placeholder="Search by name, number or hometown" value="'+esc(search)+'"></label>'+(groups.length>1?'<label>Group<select data-group><option value="">All groups</option>'+groups.map(function(g){return '<option'+(group===g?' selected':'')+'>'+esc(g)+'</option>';}).join('')+'</select></label>':'')+'<a class="su-club-btn" href="/2026-player-interest">Player interest</a></div><div data-roster-results>'+rosterGrid(d,year,search,group)+'</div><p class="su-club-source">Names, photos and published details are from the <a href="'+esc(d.rosters[year].source)+'" target="_blank" rel="noopener">'+year+' club roster</a>. Historical names and roles are preserved as published.</p></div></div>';
  }
  function align(root) {
    var h=document.querySelector('header .header-display-desktop .header-inner,header .header-inner');
    if(h){var b=h.getBoundingClientRect();if(b.width>600){root.style.setProperty('--su-content',Math.round(b.width)+'px');root.style.setProperty('--su-gutter',Math.max(16,Math.round(b.left))+'px');}}
  }
  function boot(el,type) {
    var root=el.querySelector('.su-site');if(!root)return;
    align(root);window.addEventListener('resize',function(){if(root.isConnected)align(root);});
    getData().then(function(d){
      var seasons=Object.keys(type==='schedule'?d.schedules:d.rosters).sort().reverse(),search='',group='';
      function state(){var q=new URLSearchParams(location.search),year=q.get('season');return {year:seasons.indexOf(year)>=0?year:String(d.currentSeason),match:q.get('match')||(location.hash.indexOf('#match-')===0?location.hash.slice(7):null)};}
      function render(){var st=state(),year=st.year,match=type==='schedule'&&st.match?d.schedules[year].matches.find(function(m){return m.id===st.match;}):null;
        root.innerHTML=header(type,+year,seasons,d.currentSeason,match)+(type==='schedule'?scheduleList(d,year,match?match.id:null):roster(d,year,search,group));
        if(type==='schedule'&&st.match&&!match){var notice=document.createElement('p');notice.className='su-empty-note';notice.textContent='That match is not in the selected season. Choose a fixture below.';root.querySelector('.su-club-main .su-club-wrap').prepend(notice);}
      }
      function go(q){history.pushState({},'',location.pathname+q);render();root.scrollIntoView({block:'start',behavior:'auto'});var h=root.querySelector('h1');if(h)h.focus({preventScroll:true});}
      root.addEventListener('toggle',function(e){if(type!=='schedule'||!e.target.matches('.su-match-dropdown'))return;var target=e.target;if(target.open){history.replaceState({},'',location.pathname+query(state().year)+'#'+target.id);}else if(location.hash==='#'+target.id){history.replaceState({},'',location.pathname+query(state().year));}},true);
      root.addEventListener('change',function(e){if(e.target.matches('[data-season]')){search='';group='';go(query(e.target.value));root.querySelector('[data-season]').focus();}else if(e.target.matches('[data-group]')){group=e.target.value;root.querySelector('[data-roster-results]').innerHTML=rosterGrid(d,state().year,search,group);}});
      root.addEventListener('input',function(e){if(e.target.matches('[data-search]')){search=e.target.value;root.querySelector('[data-roster-results]').innerHTML=rosterGrid(d,state().year,search,group);}});
      window.addEventListener('popstate',function(){if(root.isConnected)render();});render();
      if(type==='schedule'&&state().match){var target=root.querySelector('#match-'+CSS.escape(state().match));if(target){history.replaceState({},'',location.pathname+query(state().year)+'#'+target.id);requestAnimationFrame(function(){target.scrollIntoView({block:'start'});});}}
    }).catch(function(){root.innerHTML='<div class="su-club-wrap su-club-error"><h1>Unable to load the '+type+'.</h1><p>Please refresh the page or visit the <a href="/'+(type==='schedule'?'2025-schedule':'2025-roster')+'">original season archive</a>.</p></div>';});
  }
  window.SUClubPages={schedule:function(el){boot(el,'schedule');},roster:function(el){boot(el,'roster');}};
})();
