export class UnitData {
  constructor({
    setting = {
      isLost: false,
      autoCalcAge: false,
      color: null,
    },
    system = {
      'iachara': null,
      'coc': null, // 6版/7版
    },
    profile = new Map([
      ['名前', ''],
      ['なまえ（かな）', ''],
      ['タグ', ''],
      ['職業', ''],
      ['年齢', ''],
      ['性別', ''],
      ['身長', ''],
      ['体重', ''],
      ['出身', ''],
      ['髪の色', ''],
      ['瞳の色', ''],
      ['肌の色', ''],
      ['誕生日', ''],
      ['学位', ''],
    ]),
    // icon = [],
    status = new Map([
      ['STR', {base:null, diff:null, temp:null, sum:null}],
      ['CON', {base:null, diff:null, temp:null, sum:null}],
      ['POW', {base:null, diff:null, temp:null, sum:null}],
      ['DEX', {base:null, diff:null, temp:null, sum:null}],
      ['APP', {base:null, diff:null, temp:null, sum:null}],
      ['SIZ', {base:null, diff:null, temp:null, sum:null}],
      ['INT', {base:null, diff:null, temp:null, sum:null}],
      ['EDU', {base:null, diff:null, temp:null, sum:null}],
    ]),
    elseStatus = new Map([
      ['HP', {base:null, diff:null, temp:null, sum:null}],
      ['MP', {base:null, diff:null, temp:null, sum:null}],
      ['アイデア', {base:null, diff:null, temp:null, sum:null}],
      ['幸運', {base:null, diff:null, temp:null, sum:null}],
      ['知識', {base:null, diff:null, temp:null, sum:null}],
      ['SAN', {now: null, max: null}],
      ['ダメージボーナス', ''],
    ]),
    skill = new Map([
      ['戦闘技能', new Map()],
      ['探索技能', new Map()],
      ['行動技能', new Map()],
      ['交渉技能', new Map()],
      ['知識技能', new Map()],
    ]),
    weapon = [],     // {title, content}
    item = [],       // {title, content, asSystem}
    experience = {
      artifacts: [], // {title, content, asSystem} 
      creatures: [], 
      scenarios: [],
    },
    memo = [],       // {title, content, asSystem, isSecret}
  }={}) {
    this.setting = setting;
    this.system = system;
    this.profile = profile;
    // this.icon = icon;

    this.status = status;
    this.elseStatus = elseStatus;

    this.skill = skill;
    this.weapon = weapon;
    this.item = item;
    this.experience = experience;
    this.memo = memo;
  }

  get is6th () {
    return this.system.coc==='6版';
  }

  // methods
  isElseStatInit (statName) {
    const is6th = this.is6th;
    let calced;
    if (statName==='HP') {
      calced = (this.status.get('CON').sum + this.status.get('SIZ').sum)/2;
      if (!this.is6th) calced /= 5;
      calced = is6th ? Math.ceil(calced) : Math.floor(calced);

    } else if (statName==='MP') {
      calced = this.status.get('POW').sum;
      if (!is6th) calced /= 5;
      
    } else if (statName==='アイデア') {
      calced = this.status.get('INT').sum;
      if (is6th) calced *= 5;
      
    } else if (statName==='知識') {
      calced = this.status.get('EDU').sum;
      if (is6th) calced *= 5;
      
    } else if (statName==='幸運') {
      if (!is6th) return true;
      calced = this.status.get('POW').sum*5;

    } else if (statName==='ダメージボーナス') {
      let sum = this.status.get('STR').sum + this.status.get('SIZ').sum;
      if (is6th) {
        calced = 
          sum < 13 ? '-1D6' : 
          sum < 17 ? '-1D4' : 
          sum < 25 ? '+0' : 
          sum < 33 ? '+1D4' : 
          sum < 41 ? '+1D6' : '+2D6';
      } else {
        calced = 
          sum < 65 ? '-2' : 
          sum < 85 ? '-1' : 
          sum < 125 ? '+0' : 
          sum < 165 ? '+1D4' : 
          sum < 205 ? '+1D6' : '+2D6';
      }
      return calced === this.elseStatus.get('ダメージボーナス');
    }
    
    return calced === this.elseStatus.get(statName).sum;
  }
}

export class UnitData7th extends UnitData {
  constructor({
    setting = {
      isLost: false,
      autoCalcAge: false,
      color: null,
    },
    system = {
      'iachara': null,
      'coc': null, // 6版/7版
    },
    profile = new Map([
      ['名前', ''],
      ['なまえ（かな）', ''],
      ['タグ', ''],
      ['職業', ''],
      ['年齢', ''],
      ['性別', ''],
      ['身長', ''],
      ['体重', ''],
      ['出身', ''],
      ['髪の色', ''],
      ['瞳の色', ''],
      ['肌の色', ''],
      ['誕生日', ''],
      ['学位', ''],
    ]),
    // icon = [],
    status = new Map([
      ['STR', {base:null, diff:null, temp:null, sum:null}],
      ['CON', {base:null, diff:null, temp:null, sum:null}],
      ['POW', {base:null, diff:null, temp:null, sum:null}],
      ['DEX', {base:null, diff:null, temp:null, sum:null}],
      ['APP', {base:null, diff:null, temp:null, sum:null}],
      ['SIZ', {base:null, diff:null, temp:null, sum:null}],
      ['INT', {base:null, diff:null, temp:null, sum:null}],
      ['EDU', {base:null, diff:null, temp:null, sum:null}],
    ]),
    elseStatus = new Map([
      ['HP', {base:null, diff:null, temp:null, sum:null}],
      ['MP', {base:null, diff:null, temp:null, sum:null}],
      ['アイデア', {base:null, diff:null, temp:null, sum:null}],
      ['幸運', {base:null, diff:null, temp:null, sum:null}],
      ['知識', {base:null, diff:null, temp:null, sum:null}],
      ['SAN', {now: null, max: null}],
      ['ダメージボーナス', ''],
      // ['BLD', null],
      ['MOV', null],
    ]),
    skill = new Map([
      ['戦闘技能', new Map()],
      ['探索技能', new Map()],
      ['行動技能', new Map()],
      ['交渉技能', new Map()],
      ['知識技能', new Map()],
    ]),
    weapon = [],     // {title, content}
    item = [],       // {title, content, asSystem}
    experience = {
      artifacts: [], // {title, content, asSystem} 
      creatures: [], 
      scenarios: [],
    },
    memo = [],       // {title, content, asSystem, isSecret}
    backstories = new Map([
      ['容姿の描写', ''],
      ['イデオロギー / 信念', ''],
      ['重要な人々', ''],
      ['意味のある場所', ''],
      ['秘蔵の品', ''],
      ['特徴', ''],
      ['負傷、傷跡', ''],
      ['恐怖症、マニア', ''],
    ]),
  }={}) {
    super({
      setting: setting,
      system: system,
      profile: profile,
      status: status,
      elseStatus: elseStatus,
      skill: skill,
      weapon: weapon,
      item: item,
      experience: experience,
      memo: memo,
    })
    this.backstories = backstories;
  }

  get is6th () {
    return false;
  }
}