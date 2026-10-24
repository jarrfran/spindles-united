/* Expandable schedule reads the club spreadsheet; data/club.json supplies saved fallback and roster archives. */
(function () {
  var BASE = new URL('.', document.currentScript.src).href;
  var dataReady;
  function getData(type) {
    if(type==='schedule'&&window.SUGetClubArchive)return window.SUGetClubArchive();
    if (!dataReady) dataReady = fetch(BASE + 'data/club.json?v=' + Math.floor(Date.now()/120000)).then(function(r){if(!r.ok)throw new Error('Could not load club data');return r.json();});
    return dataReady;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function date(s, long) { return new Date(s+'T12:00:00').toLocaleDateString('en-US',long?{weekday:'long',month:'long',day:'numeric',year:'numeric'}:{month:'short',day:'numeric'}); }
  function logo(src,name) {return src?'<img src="'+esc(src)+'?format=100w" alt="" width="32" height="32">':'<span class="su-team-placeholder" aria-hidden="true">'+esc(name.charAt(0))+'</span>';}
  function score(m) {return '<span class="su-club-score"><span>'+esc(m.homeScore==null?'–':m.homeScore)+'</span><i aria-hidden="true"></i><span>'+esc(m.awayScore==null?'–':m.awayScore)+'</span></span>';}
  function teams(m) {return '<span class="su-club-match-teams"><span class="su-club-team su-club-team-home"><span>'+esc(m.home)+'</span>'+logo(m.homeCrest,m.home)+'</span>'+score(m)+'<span class="su-club-team">'+logo(m.awayCrest,m.away)+'<span>'+esc(m.away)+'</span></span></span>';}
  function query(season,match) {return '?season='+season+(match?'&match='+encodeURIComponent(match):'');}
  function venueLink(name){
    if(!name||/not recorded|TBD/i.test(name))return esc(name||'Venue not recorded');
    var cities={'Nott Road Park':'6073 Nott Road, Guilderland, NY','Lansing Park':'9 Bevan Street, Cohoes, NY','Alumni Field, Cohoes High School':'Cohoes, NY','Union College':'Schenectady, NY','Lansingburgh High School':'Troy, NY','Waterford-Halfmoon Union Free School District':'125 Middletown Road, Waterford, NY','Dockstader Recreational Park':'Galway, NY','Colonie Central High School':'Albany, NY',"Afrim's Sports Park":'969 Watervliet Shaker Road, Colonie, NY'};
    return '<a href="https://maps.apple.com/?q='+encodeURIComponent(name+' '+(cities[name]||'New York'))+'" target="_blank" rel="noopener" aria-label="Open '+esc(name)+' in Apple Maps">'+esc(name)+'</a>';
  }
  // Curated photographs from each archived season; schedule and roster keep distinct images.
  var SEASON_PHOTOS={"2022":{"schedule":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/bb00f40a-ece2-4a08-97ab-900aa60e8310/5-3+Match-01.jpg","roster":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/67092f26-b065-4354-b1ef-d894bcd04c65/5-3+Match-12.jpg"},"2025":{"schedule":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/1754004395867-DEN2F4QHYLUSLX5ZG5QX/7-29-match-69.jpg","roster":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/1754778981758-5ZSNGTCXSYJIHQ5NO37N/8-5-final-126.jpg"},"2026":{"schedule":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/8376cdba-f8e4-4d6b-a404-284fadb73df1/7-26-2026-match-039.jpg","roster":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/4945f3a0-90ea-48cc-9be9-53e66190e86b/8-9-2026-match-158.jpg"},"2023":{"schedule":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/1739237035452-RVG64MC84VWXFTPN57EF/8-1+match-3.jpg","roster":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/1737594758797-M9OMAUUGJ6LU1JZALUOY/DSC_1860-2.jpg"},"2024":{"schedule":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/1728613693351-G7AJZ058BEDUY2M014MF/7-11+match-021_edited.png","roster":"https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/1728262065547-WGXN6GGROGF95R9UHRZ1/7-25+Match-22.JPG"}};
  function header(type,year,years,current,match) {
    var seasonPhotos=SEASON_PHOTOS[year]||SEASON_PHOTOS[current]||SEASON_PHOTOS[2026];
    var photo=seasonPhotos[type]+'?format=1500w';
    var title=type==='schedule'?'Matches & Results.':'Meet the Spins.';
    return '<div class="su-club-hero"><img class="su-club-hero-photo" src="'+photo+'" alt="" fetchpriority="high"><div class="su-club-wrap su-club-heading"><div><p class="su-club-eyebrow">'+year+' Season</p><h1 tabindex="-1">'+title+'</h1><p>'+ (type==='schedule'?'Every match. Every season. Follow the Spins.':'The players behind the crest. Our club, past and present.')+'</p></div><label class="su-season-picker">Season<select data-season aria-label="Choose '+type+' season">'+years.map(function(y){return '<option value="'+y+'"'+(String(y)===String(year)?' selected':'')+'>'+y+(+y===current?' · Current':'')+'</option>';}).join('')+'</select></label></div></div>';
  }
  function chevron() {return '<svg class="su-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
  function eventPerson(e,m) {
    var side=e.playerSide||e.side,name=e.player||e.detail||'',note=e.type==='goal'&&/penalty/i.test(e.note||'')?'Penalty':'';
    if(e.assist)note=(note?note+' · ':'')+'Assist: '+e.assist;
    return '<div class="su-timeline-person"><span class="su-timeline-name"><b>'+esc(name)+'</b>'+(note?'<small>'+esc(note)+'</small>':'')+'</span>'+logo(m[side+'Crest'],m[side])+'<time>'+(e.minute==null?'—':esc(e.minute)+'′')+'</time></div>';
  }
  function timeline(m,year) {
    var events=m.events||[],full=m.eventCoverage==='both-teams';
    var note=(m.opponentEvents?'Spindles goals, assists and cards: club archive. Opponent events: league match reports.':'Spindles goals, assists and cards. Opponent events are not recorded in this archive.')+' Unrecorded minutes are shown as —.'+(m.eventCountNote?' '+m.eventCountNote:'');
    if(!events.length){var spGoals=m.home==='Spindles'?m.homeScore:m.awayScore;return '<section class="su-match-events su-timeline"><h3>Match Events</h3><p class="su-empty-note">'+(m.forfeit?'Awarded win by forfeit. This match was not played.':m.result==='TBD'?'Match events will appear after the game.':m.result==='NC'?'This match was recorded as no contest.':spGoals===0?'No Spindles goals in this match.':'Scorer details were not published for this fixture.')+'</p><p class="su-timeline-note">'+esc(note)+'</p></section>';}
    return '<section class="su-match-events su-timeline" aria-label="Match events for '+esc(m.home+' vs '+m.away)+'"><h3>Match Events</h3><div class="su-timeline-teams"><span>Home · '+esc(m.home)+'</span><span></span><span>Away · '+esc(m.away)+'</span></div><ol class="su-timeline-list">'+events.map(function(e){
      var goal=e.type==='goal',badge=goal?(full?'<span class="su-timeline-score" aria-label="Score '+e.homeScore+' to '+e.awayScore+'">'+'<span>'+e.homeScore+'</span><i aria-hidden="true"></i><span>'+e.awayScore+'</span>'+'</span>':'<span class="su-timeline-goal" aria-label="Goal">⚽</span>'):'<span class="su-timeline-card" aria-label="'+(e.type==='red'?'Red':'Yellow')+' card"><i class="su-card-'+esc(e.type)+'" aria-hidden="true"></i></span>';
      return '<li class="su-timeline-row su-event-'+esc(e.type)+'"><div class="su-timeline-side su-timeline-home">'+(e.side==='home'?eventPerson(e,m):'')+'</div><div class="su-timeline-marker">'+badge+'</div><div class="su-timeline-side su-timeline-away">'+(e.side==='away'?eventPerson(e,m):'')+'</div></li>';
    }).join('')+'</ol><p class="su-timeline-note">'+esc(note)+'</p></section>';
  }
  function matchDetails(m,year) {
    var links=(m.recapUrl?'<a class="su-club-btn su-recap-btn" href="'+esc(m.recapUrl)+'">Match Recap '+chevron()+'</a>':'')+(m.video?'<a class="su-club-btn su-stream-btn" href="'+esc(m.video)+'" target="_blank" rel="noopener"><svg class="su-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3v18l15-9z"/></svg>Watch the Stream</a>':'');
    return '<div class="su-fixture-detail">'+(links?'<div class="su-match-links">'+links+'</div>':'')+timeline(m,year)+'</div>';
  }
  function matchCard(m,year,open){var weekday=new Date(m.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'});return '<details class="su-match-dropdown" id="match-'+esc(m.id)+'"'+(open?' open':'')+'><summary class="su-fixture"><span class="su-fixture-date"><span class="su-fixture-weekday">'+esc(weekday)+'</span><b>'+esc(date(m.date))+'</b><small>'+esc(m.kickoff||'Time not recorded')+'</small></span><span class="su-fixture-center"><span class="su-fixture-comp">'+esc(m.competition)+(m.note?' · '+esc(m.note):'')+'</span>'+teams(m)+'<span class="su-fixture-place">'+venueLink(m.venue)+'</span></span><span class="su-fixture-action"><span class="su-res su-res-'+(m.result==='W'?'w':m.result==='L'?'l':'d')+'">'+esc(m.result)+'</span><span class="su-fixture-toggle-label">Match details</span><i class="su-disclosure-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/></svg></i></span></summary>'+matchDetails(m,year)+'</details>';
  }
  function scheduleList(d,year,openMatch) {
    var season=d.schedules[year],matches=season.matches.slice().sort(function(a,b){return b.date.localeCompare(a.date);}),month='';
    return '<div class="su-club-main"><div class="su-club-wrap"><div class="su-club-season-facts"><div><small>Season</small><b>'+year+'</b></div><div><small>Regular Season</small><b>'+esc(season.summary.replace('Regular Season Record ',''))+'</b></div><div><small>Postseason</small><b>'+esc(season.finish.replace('Post Season Finish: ',''))+'</b></div></div><div class="su-schedule-layout"><div class="su-schedule-fixtures"><div class="su-club-list-heading"><h2>'+year+' Fixtures & Results</h2><p>Select a match for details · All times Eastern</p></div>'+matches.map(function(m){
      var md=m.date.slice(0,7),heading='',weekday=new Date(m.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'});
      if(md!==month){month=md;heading='<h3 class="su-match-month">'+new Date(m.date+'T12:00:00').toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</h3>';}
      return heading+matchCard(m,year,m.id===openMatch);
    }).join('')+'<p class="su-club-source">'+esc(d.scheduleNotes&&d.scheduleNotes[year]||d.scheduleNotes.archives)+'</p>'+(d.sheetSync?'<p class="su-club-source" data-archive-status>'+esc(d.sheetSync.status==='live'?'Club archive connected · Checks for updates every 5 minutes.':'Showing the saved club archive. Live updates will retry automatically.')+'</p>':'')+'</div><aside class="su-schedule-news" aria-label="Recent club news"><div data-su-news="sidebar" data-news-season="'+year+'"></div></aside></div></div></div>';
  }
  function photo(u,i,m) {return '<a href="'+esc(u)+'" target="_blank" rel="noopener" aria-label="Open match photo '+(i+1)+'"><img src="'+esc(u)+'?format=750w" loading="lazy" alt="'+esc(m.home+' vs '+m.away+', match photo '+(i+1))+'"></a>';}
  function rosterGrid(d,year,search,group) {
    var list=d.rosters[year].players.filter(function(p){return (!group||p.group===group)&&(!search||(p.name+' '+p.bio+' '+(p.number||'')).toLowerCase().includes(search.toLowerCase()));});
    var groups=[];list.forEach(function(p){if(groups.indexOf(p.group)<0)groups.push(p.group);});
    return '<p class="su-roster-count" role="status">'+list.length+' '+(list.length===1?'person':'people')+' in the '+year+' archive</p>'+(list.length?groups.map(function(g){return '<section class="su-roster-group">'+(/^first team$/i.test(g)?'':'<h2>'+esc(g)+'</h2>')+'<div class="su-roster-grid">'+list.filter(function(p){return p.group===g;}).map(function(p){return '<a class="su-roster-card" href="'+window.SURecordBook.href(p.name)+'" aria-label="View '+esc(p.name)+' player profile"><div class="su-roster-photo"><img src="'+esc(p.photo)+'?format=750w" loading="lazy" alt="'+esc(p.name)+'">'+(p.number?'<span class="su-roster-number" aria-label="Squad number '+esc(p.number)+'">'+esc(p.number)+'</span>':'')+'</div><div class="su-roster-card-copy"><h3>'+esc(p.name)+'</h3>'+(p.bio?'<p>'+esc(p.bio)+'</p>':'')+'</div></a>';}).join('')+'</div></section>';}).join(''):'<p class="su-empty-note">No players match your search. Try another name or clear the filters.</p>');
  }
  function roster(d,year,search,group) {
    var groups=[];d.rosters[year].players.forEach(function(p){if(groups.indexOf(p.group)<0)groups.push(p.group);});
    return '<div class="su-club-main"><div class="su-club-wrap"><div class="su-roster-toolbar"><label>Find a Player<input type="search" data-search placeholder="Search by name, number or hometown" value="'+esc(search)+'"></label>'+(groups.length>1?'<label>Group<select data-group><option value="">All Groups</option>'+groups.map(function(g){return '<option'+(group===g?' selected':'')+'>'+esc(g)+'</option>';}).join('')+'</select></label>':'')+'<a class="su-club-btn" href="/contact">Player Interest</a></div><div data-roster-results>'+rosterGrid(d,year,search,group)+'</div><p class="su-club-source">Names, photos and published details are from the <a href="'+esc(d.rosters[year].source)+'" target="_blank" rel="noopener">'+year+' club roster</a>. Historical names and roles are preserved as published.</p></div></div>';
  }
  function align(root) {
    var h=document.querySelector('header .header-display-desktop .header-inner,header .header-inner');
    if(h){var b=h.getBoundingClientRect();if(b.width>600){root.style.setProperty('--su-content',Math.round(b.width)+'px');root.style.setProperty('--su-gutter',Math.max(16,Math.round(b.left))+'px');}}
  }
  function boot(el,type) {
    var root=el.querySelector('.su-site');if(!root)return;
    align(root);window.addEventListener('resize',function(){if(root.isConnected)align(root);});
    Promise.all([getData(type),type==='roster'?window.SUGetRecordBook():Promise.resolve(null)]).then(function(values){
      var d=values[0],records=values[1];
      var seasons=Object.keys(type==='schedule'?d.schedules:d.rosters).sort().reverse(),search='',group='';
      function state(){var q=new URLSearchParams(location.search),year=q.get('season');return {year:seasons.indexOf(year)>=0?year:String(d.currentSeason),match:q.get('match')||(location.hash.indexOf('#match-')===0?location.hash.slice(7):null)};}
      function render(){
        var profileId=type==='roster'&&new URLSearchParams(location.search).get('player');
        if(profileId){root.innerHTML='<div class="su-club-loading" role="status" aria-label="Loading player profile"></div>';records.load().then(function(data){if(new URLSearchParams(location.search).get('player')===profileId)records.profile(root,data,profileId);}).catch(function(){root.innerHTML='<div class="su-club-wrap su-record-main"><h1>Unable to Load This Player</h1><p>Please refresh to try again.</p></div>';});return;}
        var st=state(),year=st.year,match=type==='schedule'&&st.match?d.schedules[year].matches.find(function(m){return m.id===st.match;}):null;
        root.innerHTML=header(type,+year,seasons,d.currentSeason,match)+(type==='schedule'?scheduleList(d,year,match?match.id:null):roster(d,year,search,group));
        if(type==='schedule'&&st.match&&!match){var notice=document.createElement('p');notice.className='su-empty-note';notice.textContent='That match is not in the selected season. Choose a fixture below.';root.querySelector('.su-club-main .su-club-wrap').prepend(notice);}
      }
      function go(q){var y=scrollY;history.pushState({},'',location.pathname+q);render();scrollTo(0,y);requestAnimationFrame(function(){scrollTo(0,y);});}
      root.addEventListener('toggle',function(e){if(type!=='schedule'||!e.target.matches('.su-match-dropdown'))return;var target=e.target;if(target.open){history.replaceState({},'',location.pathname+query(state().year)+'#'+target.id);}else if(location.hash==='#'+target.id){history.replaceState({},'',location.pathname+query(state().year));}},true);
      root.addEventListener('change',function(e){if(e.target.matches('[data-season]')){search='';group='';go(query(e.target.value));root.querySelector('[data-season]').focus({preventScroll:true});}else if(e.target.matches('[data-group]')){group=e.target.value;root.querySelector('[data-roster-results]').innerHTML=rosterGrid(d,state().year,search,group);}});
      root.addEventListener('input',function(e){if(e.target.matches('[data-search]')){search=e.target.value;root.querySelector('[data-roster-results]').innerHTML=rosterGrid(d,state().year,search,group);}});
      window.addEventListener('popstate',function(){if(root.isConnected)render();});render();
      if(type==='schedule'){
        var refreshing=false, timer=setInterval(function(){
          if(!root.isConnected){clearInterval(timer);return;}
          if(document.hidden||refreshing||root.querySelector('[data-season]')===document.activeElement)return;
          refreshing=true;window.SUGetClubArchive(true).then(function(next){
            var opened=Array.from(root.querySelectorAll('.su-match-dropdown[open]')).map(function(e){return e.id;}),y=window.scrollY;
            if(JSON.stringify(d.schedules)===JSON.stringify(next.schedules)&&d.sheetSync.status===next.sheetSync.status)return;
            d=next;seasons=Object.keys(d.schedules).sort().reverse();render();opened.forEach(function(id){var el=document.getElementById(id);if(el)el.open=true;});window.scrollTo(0,y);
          }).finally(function(){refreshing=false;});
        },300000);
      }

      if(type==='schedule'&&state().match){var target=root.querySelector('#match-'+CSS.escape(state().match));if(target){history.replaceState({},'',location.pathname+query(state().year)+'#'+target.id);requestAnimationFrame(function(){target.scrollIntoView({block:'start'});});}}
    }).catch(function(){root.innerHTML='<div class="su-club-wrap su-club-error"><h1>Unable to load the '+type+'.</h1><p>Please refresh the page or visit the <a href="/'+(type==='schedule'?'2025-schedule':'2025-roster')+'">original season archive</a>.</p></div>';});
  }
  window.SUClubPages={matchCard:matchCard,schedule:function(el){boot(el,'schedule');},roster:function(el){boot(el,'roster');}};
})();
