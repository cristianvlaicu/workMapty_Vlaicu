class t{date=new Date;id=(Date.now()+"").slice(-10);clicks=0;constructor(t,e,s){this.coords=t,this.distance=e,this.duration=s}_setDescription(){this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${["January","February","March","April","May","June","July","August","September","October","November","December"][this.date.getMonth()]} ${this.date.getDate()}`}click(){this.clicks++}}class e extends t{type="running";constructor(t,e,s,o){super(t,e,s),this.cadence=o,this.calcPace(),this._setDescription()}calcPace(){return this.pace=this.duration/this.distance,this.pace}}class s extends t{type="cycling";constructor(t,e,s,o){super(t,e,s),this.elevationGain=o,this.calcSpeed(),this._setDescription()}calcSpeed(){return this.speed=this.distance/(this.duration/60),this.speed}}const o=document.querySelector(".form"),i=document.querySelector(".workouts"),a=document.querySelector(".form__input--type"),n=document.querySelector(".form__input--distance"),r=document.querySelector(".form__input--duration"),l=document.querySelector(".form__input--cadence"),u=document.querySelector(".form__input--elevation");new class{#t;#e=13;#s;#o=[];constructor(){this._getPosition(),this._getLocalStorage(),o.addEventListener("submit",this._newWorkout.bind(this)),a.addEventListener("change",this._toggleElevationField),i.addEventListener("click",this._moveToPopup.bind(this)),i.addEventListener("click",this._handleWorkoutActions.bind(this))}_getPosition(){navigator.geolocation&&navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){alert("Could not get your position")})}_loadMap(t){let{latitude:e}=t.coords,{longitude:s}=t.coords;this.#t=L.map("map").setView([e,s],this.#e),L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.#t),this.#t.on("click",this._showForm.bind(this)),this.#o.forEach(t=>{this._renderWorkoutMarker(t)})}_showForm(t){this.#s=t,o.classList.remove("hidden"),n.focus()}_hideForm(){n.value=r.value=l.value=u.value="",o.style.display="none",o.classList.add("hidden"),setTimeout(()=>o.style.display="grid",1e3)}_toggleElevationField(){u.closest(".form__row").classList.toggle("form__row--hidden"),l.closest(".form__row").classList.toggle("form__row--hidden")}_handleWorkoutActions(t){let e=t.target;if(e.classList.contains("btn--delete")){let t=e.dataset.id;this._deleteWorkout(t)}if(e.classList.contains("btn--edit")){let t=e.dataset.id;this._editWorkout(t)}}_newWorkout(t){let o;let i=(...t)=>t.every(t=>Number.isFinite(t)),c=(...t)=>t.every(t=>t>0);t.preventDefault();let d=a.value,p=+n.value,_=+r.value,{lat:h,lng:m}=this.#s.latlng;if("running"===d){let t=+l.value;if(!i(p,_,t)||!c(p,_,t))return alert("Inputs have to be positive numbers!");o=new e([h,m],p,_,t)}if("cycling"===d){let t=+u.value;if(!i(p,_,t)||!c(p,_))return alert("Inputs have to be positive numbers!");o=new s([h,m],p,_,t)}this.#o.push(o),this._renderWorkoutMarker(o),this._renderWorkout(o),this._hideForm(),this._setLocalStorage()}_editWorkout(t){let i=this.#o.find(e=>e.id===t);a.value=i.type,n.value=i.distance,r.value=i.duration,"running"===i.type&&(l.value=i.cadence,u.closest(".form__row").classList.add("form__row--hidden"),l.closest(".form__row").classList.remove("form__row--hidden")),"cycling"===i.type&&(u.value=i.elevationGain,l.closest(".form__row").classList.add("form__row--hidden"),u.closest(".form__row").classList.remove("form__row--hidden")),o.classList.remove("hidden"),n.focus(),this.#o=this.#o.filter(e=>e.id!==t),o.addEventListener("submit",(function t(c){let d;c.preventDefault();let p=a.value,_=+n.value,h=+r.value;if("running"===p){let t=+l.value;if(!_||!h||!t)return alert("Please provide valid inputs!");d=new e(i.coords,_,h,t)}if("cycling"===p){let t=+u.value;if(!_||!h||!t)return alert("Please provide valid inputs!");d=new s(i.coords,_,h,t)}this.#o.push(d),this._setLocalStorage(),location.reload(),o.removeEventListener("submit",t)}).bind(this))}_deleteWorkout(t){let e=this.#o.findIndex(e=>e.id===t);this.#o.splice(e,1),this._setLocalStorage(),location.reload()}_renderWorkoutMarker(t){L.marker(t.coords).addTo(this.#t).bindPopup(L.popup({maxWidth:250,minWidth:100,autoClose:!1,closeOnClick:!1,className:`${t.type}-popup`})).setPopupContent(`${"running"===t.type?"\uD83C\uDFC3‍♂️":"\uD83D\uDEB4‍♀️"} ${t.description}`).openPopup()}_renderWorkout(t){let e=`
      <li class="workout workout--${t.type}" data-id="${t.id}">
        <h2 class="workout__title">${t.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${"running"===t.type?"\uD83C\uDFC3‍♂️":"\uD83D\uDEB4‍♀️"}</span>
          <span class="workout__value">${t.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">\u{23F1}</span>
          <span class="workout__value">${t.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;"running"===t.type&&(e+=`
        <div class="workout__details">
          <span class="workout__icon">\u{26A1}\u{FE0F}</span>
          <span class="workout__value">${t.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">\u{1F9B6}\u{1F3FC}</span>
          <span class="workout__value">${t.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `),"cycling"===t.type&&(e+=`
        <div class="workout__details">
          <span class="workout__icon">\u{26A1}\u{FE0F}</span>
          <span class="workout__value">${t.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">\u{26F0}</span>
          <span class="workout__value">${t.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `),e+=`
      <div class="workout__actions">
        <button class="btn btn--edit" data-id="${t.id}">Edit</button>
        <button class="btn btn--delete" data-id="${t.id}">Delete</button>
      </div>
    </li>
    `,o.insertAdjacentHTML("afterend",e)}_moveToPopup(t){if(!this.#t)return;let e=t.target.closest(".workout");if(!e)return;let s=this.#o.find(t=>t.id===e.dataset.id);this.#t.setView(s.coords,15,{animate:!0,pan:{duration:2}})}_setLocalStorage(){localStorage.setItem("workouts",JSON.stringify(this.#o))}_getLocalStorage(){let t=JSON.parse(localStorage.getItem("workouts"));t&&(this.#o=t,this.#o.forEach(t=>{this._renderWorkout(t)}))}reset(){localStorage.removeItem("workouts"),location.reload()}};
//# sourceMappingURL=index.0f4dd230.js.map
