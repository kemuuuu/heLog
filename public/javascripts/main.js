(function() {
  window.onload = () => {
    const b = document.getElementById('sf-btn')
    if (b) b.onclick = (e) => sfintegrate(e)
    b.style.display = "hidden"

    const linkedin = document.getElementById('linkedin-btn')
    if (linkedin) linkedin.onclick = (e) => linkedintegrate(e)
  }
})()

// linekdin連携
const linkedintegrate = (event) => {
  event.preventDefault();
  fetch('/api/auth/linkedin')
  .then((res) => res.json().then(json => {
    location.href = json.result
  }))
  .catch(console.error)
}

// salesforce連携
const sfintegrate = (event) => {
  event.preventDefault();
  fetch('/api/getRecords')
  .then((res)=> res.json().then(json => {
    const recs = json.result.records.map((e,i) => {
      let d;
      if (!e.latestVisitDate__c) d = '2019-01-01'
      else d = e.latestVisitDate__c
      
      return '<div class="item">' +
              `<li id="${e.Id}" class="rec-list-item">name:<input class="rec-input" id="${e.Id}-name" value=${e.Name} />` + 
              `<span class='column'>count:<input type="number" class="rec-input" id="${e.Id}-count" value=${e.count__c} /></span>` + 
              `<span class='column'>date:<input type="date" class="rec-input" id="${e.Id}-date" value=${d} /></span>` + 
              `<a href="#" id="${e.Id}" class="btn-circle-kirby">SAVE</a>` +
             `</li>` +
             '</div>';
    }).join('')
    const lst = document.getElementById('records-list')
    lst.insertAdjacentHTML('afterbegin',recs)
    const btns = document.getElementsByClassName('btn-circle-kirby')
    Array.prototype.forEach.call(btns, btn => {
      btn.onclick = (e) => handleClick(e)
    })
  }))
  .catch(console.error)
}

// salesforce保存時
const handleClick = (e) => {
  const id = e.target.id
  const name = document.getElementById(id + '-name').value
  const count = document.getElementById(id + '-count').value
  const date = document.getElementById(id + '-date').value

  const endpoint = '/api/update'
  const obj = {
    Id: id,
    Name: name,
    Count__c: count,
    latestVisitDate__c: date,
  };
  const method = "POST"
  const body = Object.keys(obj).map((key)=>key+"="+encodeURIComponent(obj[key])).join("&")
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
  }
  fetch(endpoint, {method, headers, body})
  .then(res => res.json())
  .then(json => confirm(json.result + 'はUpdateされました。'))
  .catch(console.error)
}