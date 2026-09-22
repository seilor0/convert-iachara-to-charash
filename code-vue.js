import BasicDialog from './components/basic-dialog.js'
// import ButtonCssIcon from './components/button-css-icon.js'
import ButtonTag from './components/button-tag.js';
import ToggleButton from './components/toggle-button.js'
import GoogleIcon from './components/google-icon.js';

import { UnitData, UnitData7th } from "./components/class.js";

const { createApp, ref, computed, watch, onMounted, toRaw } = Vue;


const rootApp = createApp({
  components: {
    BasicDialog,
    ButtonTag,
    ToggleButton,
    GoogleIcon,
  },
  setup() {
    const setting = ref({
      import: {
        tag: false,
        skil: false,
        academic: false
      }
    });
    const editUnitIndex = ref(0);
    /** @type UnitData[] */
    const unitDatas = ref([]);
    const editUnit = computed(() => unitDatas.value[editUnitIndex.value]);
    const initSkills = {'6版': new Map(), '7版': new Map()};
    

    async function importIacharaTextFile (e) {
      const files = e.currentTarget.files;
      if (!files.length) return;
      const jsonDatas = await Promise.all(Array.from(files, async file => {
        const text = await file.text();
        return text2unitdata(text);
      }));
      unitDatas.value.push(...jsonDatas.filter(Boolean));
    }


    async function saveAsCharashTextFile() {
      const link = document.createElement('a');
      if (unitDatas.value.length===0) {
        window.alert('変換するキャラクターデータがありません');

      } else if (unitDatas.value.length===1) {
        const textData = unitdata2charash(unitDatas.value[0]);
        const blob = new Blob([textData], {type: 'text/plain'});
        link.href = URL.createObjectURL(blob);
        link.download = `${unitDatas.value[0].profile.get('名前')}.txt`;

      } else {
        const zipBlob = await new Promise (resolve => {
          const zip = new JSZip();
          unitDatas.value.forEach(unitData => {
            const textData = unitdata2charash(unitData);
            zip.file(`${unitData.profile.get('名前')}.txt`, textData);
          });
          resolve(zip.generateAsync({type:'blob'}));
        });
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'iachara-to-charash.zip';
      }

      link.click();
      URL.revokeObjectURL(link.href);
    }


    function text2unitdata (iacharaText) {
      if (!iacharaText.length) return;
      if (!iacharaText.startsWith('いあきゃら')) return;

      // --------------
      // 項目ごとに分割
      // --------------
      const base = {};
      {
        // header
        base.system = iacharaText.match(/^.+/)[0];
        iacharaText = iacharaText.replace(/^.+\n/, '');
  
        // 基本情報
        base.profile = iacharaText.match(/(【基本情報】.+?)(?:\n【|$)/s)?.[1].trim();
        iacharaText = iacharaText.replace(/【基本情報】.+?(?=(?:\n【|$))/s, '');
        
        // アイコン
        base.icon = iacharaText.match(/(【アイコン】.+?)(?:\n【|$)/s)?.[1].trim();
        iacharaText = iacharaText.replace(/【アイコン】.+?(?=(?:\n【|$))/s, '');
        
        // 能力値
        base.status = iacharaText.match(/(【能力値】.+?)(?:\n【|$)/s)?.[1].trim();
        iacharaText = iacharaText.replace(/【能力値】.+?(?=(?:\n【|$))/s, '');
  
        // 技能値
        base.skill = iacharaText.match(/(【技能値】.+?)(?:\n【|$)/s)?.[1].trim();
        iacharaText = iacharaText.replace(/【技能値】.+?(?=(?:\n【|$))/s, '');
  
        // 武器
        base.weapon = iacharaText.match(/(【(?:戦闘・武器・防具|武器)】.+?)(?:\n【|$)/s)?.[1].trim();
        iacharaText = iacharaText.replace(/【(?:戦闘・武器・防具|武器)】.+?(?=(?:\n【|$))/s, '');
  
        // 冒険の装備とその他の所持品
        base.item = iacharaText.match(/(【(?:所持品|冒険の装備とその他の所持品|装備と所持品)】.+?)(?:\n【|$)/s)?.[1].trim();
        iacharaText = iacharaText.replace(/【(?:所持品|冒険の装備とその他の所持品|装備と所持品)】.+?(?=(?:\n【|$))/s, '');
        
        // メモ
        base.memo = iacharaText.match(/(【メモ】.+?)(?:\n【|$)/s)[1].trim();
        iacharaText = iacharaText.replace(/【メモ】.+?(?=(?:\n【|$))/s, '');
  
        // 収入と財産
        base.assets = iacharaText.match(/(【収入と財産】.+?)(?:\n【|$)/s)?.[1].trim();
        iacharaText = iacharaText.replace(/【収入と財産】.+?(?=(?:\n【|$))/s, '');
  
        if (base.system.includes('6版')) {
          // 新たに得た知識・経験
          base.experience = iacharaText.match(/(【新たに得た知識・経験】.+?)(?:\n【|$)/s)?.[1].trim();
          iacharaText = iacharaText.replace(/【新たに得た知識・経験】.+?(?=(?:\n【|$))/s, '');
        } else {
          // backstories
          let backstories = iacharaText.match(/【バックストーリー】(.+?)\[魔導書、呪文、アーティファクト\]/s)?.[1].trim();
          iacharaText = iacharaText.replace(/【バックストーリー】.+?(?=\[魔導書、呪文、アーティファクト\])/s, '');
          
          // artifacts
          let artifacts = iacharaText.match(/\[魔導書、呪文、アーティファクト\](.+?)\[遭遇した超自然の存在\]/s)?.[1].trim();
          iacharaText = iacharaText.replace(/\[魔導書、呪文、アーティファクト\].+?(?=\[遭遇した超自然の存在\])/s, '');
          
          // creatures
          let creatures = iacharaText.match(/\[遭遇した超自然の存在\](.+?)【通過したシナリオ名】/s)?.[1].trim();
          iacharaText = iacharaText.replace(/\[遭遇した超自然の存在\].+?(?=【通過したシナリオ名】)/s, '');
          
          // scenarios
          let scenarios = iacharaText.match(/【通過したシナリオ名】(.+?)(?:\n【|$)/s)?.[1].trim();
          iacharaText = iacharaText.replace(/【通過したシナリオ名】.+?(?=(?:\n【|$))/s, '');

          base.experience = {
            backstories: backstories,
            artifacts: artifacts,
            creatures: creatures,
            scenarios: scenarios,
          }
        }
      }

      
      // --------------
      // 情報抽出
      // --------------
      const unit = base.system.includes('6版') ? new UnitData() : new UnitData7th();

      // system
      unit.system.iachara = base.system.match(/v([\d.]+)$/)[1];
      unit.system.coc = base.system.includes('6版') ? '6版' : '7版';

      // 基本情報
      unit.profile.keys().forEach(key => {
        const regExp = new RegExp(`${key}:(.*?)(?:\\n| / |$)`);
        const match = base.profile.match(regExp)?.[1].trim();
        
        if (!match) {
          return;
  
        } else if (key==='名前') {
          const {name, nameReading} = match.match(/(?<name>.*?) *\((?<nameReading>.*?)\)$/)?.groups ?? {name:match, nameReading:''};
          unit.profile.set('名前', name);
          unit.profile.set('なまえ（かな）', nameReading);
  
        } else if (key==='誕生日') {
          const {month, day} = match.match(/(?<month>\d+)[^\d]+?(?<day>\d+)[^\d]*?$/)?.groups ?? {};
          if (!month) return;
          unit.profile.set('誕生日', `${month}月${day}日`);
  
        } else {
          unit.profile.set(key, match);
        }
      });


      // // アイコン
      // unit.icon = Array.from(base.icon.matchAll(/^:(https:.+)/mg), arr=>arr[1]);


      // 能力値
      base.status
        .split('\n')
        .splice(2)
        .filter(Boolean)
        .forEach((row, index) => {
          if (index < 14) {
            let [key, sum, base, diff, temp] = row.split(/ +/).splice(0,5);
            sum = parseInt(sum);
            base = parseInt(base);
            diff = parseInt(diff);
            temp = parseInt(temp);
            switch(key) {
              case '正気度':
                if (diff*temp !== 0) unit.elseStatus.get('正気度').now = sum;
                break;
              case 'IDE':
                key = 'アイデア';
              default:
                unit[index<8 ? 'status' :'elseStatus']
                  .set(key, {base: base, diff: diff, temp: temp, sum: sum});
            }

          } else if (index===14) {
            let {now,max} = row.match(/(?<now>\d+) \/ (?<max>\d+)/).groups;
            now = parseInt(now);
            max = parseInt(max);
            if (now !== 0) unit.elseStatus.get('SAN').now = now;
            unit.elseStatus.get('SAN').max = max;

          } else if (index===15) {
            unit.elseStatus.set('ダメージボーナス', row.match(/DB ([-+D\d]+)/i)[1].toUpperCase());

          // 7th: BLD
          } else if (index===16) {
            return;

          // 7th: MOV
          } else if (index===17) {
            unit.elseStatus.set('MOV', parseInt(row.match(/MOV (\d+)/i)[1]));
          }
        });


      // 技能値
      /* 
      // 職業ポイント・興味ポイント
      const {jobNow,jobMax} = base.skill.match(/職業ポイント: *(?<jobNow>\d+) *\/ *(?<jobMax>\d+)/).groups;
      const {iNow,iMax} = base.skill.match(/興味ポイント: *(?<iNow>\d+) *\/ *(?<iMax>\d+)/).groups;
      unit.skill.pt.job.use = parseInt(jobNow);
      unit.skill.pt.job.max = parseInt(jobMax);
      unit.skill.pt.interest.use = parseInt(iNow);
      unit.skill.pt.interest.max = parseInt(iMax);
       */
      // 各技能値
      unit.skill.keys().forEach(key => {
        const regex = new RegExp(`『${key}』(.+?)(?:\\n『|$)`, 's'); // /『戦闘技能』(.+?)(?:\n『|$)/s
        base.skill
          .match(regex)[1]
          .trim()
          .split('\n')
          .splice(1)
          .forEach(row => {
            let [name,sum,init,job,interest,growth,el] = row.split(/ +/).splice(0,7);
            name = [
              ['こぶし（パンチ）', 'こぶし／パンチ'],
              ['(', '（'],
              [')', '）']
            ].reduce((acc, [key, value]) => acc = acc.replaceAll(key, value), name);
            init     = parseInt(init);
            job      = parseInt(job);
            interest = parseInt(interest);
            growth   = parseInt(growth);
            el       = parseInt(el);
            sum      = parseInt(sum);
            unit['skill'].get(key).set(name, {init:init, job:job, interest:interest, growth:growth, else:el, sum:sum});
          });
      });


      // 戦闘・武器・防具
      base.weapon
        .split('\n')
        .splice(2)
        .filter(Boolean)
        .forEach(row => {
          const name = row.match(/^(.*?) +/)[1];
          const content = row.replace(/^.*? +/, '').trim().replace(/ +/g, '/');
          unit.weapon.push({title: name, content: content});
        });


      // 所持金
      // unit.assets = {}
      // unit.assets.money = base.item.match(/現在の所持金:(.*)/)[1].trim();
      // unit.assets.debt = base.item.match(/借金:(.*)/)[1].trim();
      

      // 所持品
      base.item
        .replace(/現在の所持金:.*/s, '')
        .split('\n')
        .splice(2)
        .filter(Boolean)
        .forEach(row => {
          if (row.startsWith(' ')) return;
          const name = row.match(/^(.*?) +/)[1];
          const content = row.replace(/^.*? +/, '').trim().replace(/ +/g, '/');
          unit.item.push({title: name, content: content, asSystem: true});
        });
      

      // メモ
      base.memo
        .split(/^\[/m)
        .forEach((value,index) => {
          if (index===0) {
            unit.memo.push({
              title: '', 
              content: value.replace(/^【メモ】\n/, '').trim(),
              asSystem: true,
              isSecret: false, 
            });
          } else {
            const tab = value.match(/^(.*)\]\n/)[1];
            unit.memo.push({
              title: tab,
              content: value.replace(/^.*\]\n/, '').trim(),
              asSystem: true,
              isSecret: tab.includes('秘匿'), 
            });
          }
        });

      
      // 6版項目
      if (unit.system.coc==='6版') {
        // 新たに得た知識・経験
        // -- 〈魔導書、呪文、アーティファクト〉
        // -- 〈遭遇した超自然の存在〉
        // -- 〈通過したシナリオ名〉
        // 新たに得た知識・経験
        (new Map([
          ['artifacts', base.experience.match(/〈魔導書、呪文、アーティファクト〉(.*?)(?:\n〈|$)/s)[1].trim()],
          ['creatures', base.experience.match(/〈遭遇した超自然の存在〉(.*?)(?:\n〈|$)/s)[1].trim()],
          ['scenarios', base.experience.match(/〈通過したシナリオ名〉(.*?)(?:\n〈|$)/s)[1].trim()],
        ])).forEach((value,key) => {
          value
            .split(/^\[/m)
            .filter(Boolean)
            .forEach(text => {
              const name = text.match(/^(.*)\](?:\n|$)/)[1];
              const content = text.replace(/^.*\](?:\n|$)/, '').trim();
              unit['experience'][key].push({title: name, content: content, asSystem: true});
            });
        });
      }
      // 7版項目
      else {
        // バックストーリー
        // -- [容姿の描写]
        // -- [イデオロギー / 信念]
        // -- [重要な人々]
        // -- [意味のある場所]
        // -- [秘蔵の品]
        // -- [特徴]
        // -- [負傷、傷跡]
        // -- [恐怖症、マニア]
        base.experience.backstories
          .replace('[イデオロギー/信念]', '[イデオロギー / 信念]')
          .split(/^\[/m)
          .filter(Boolean)
          .forEach(text => {
            const name = text.match(/^(.*)\](?:\n|$)/)[1];
            const content = text.replace(/^.*\](?:\n|$)/, '').trim();
            if (content) unit.backstories.set(name, content);
          });

        // -- [魔導書、呪文、アーティファクト]
        // -- [遭遇した超自然の存在]
        // 通過したシナリオ名
        ['artifacts', 'creatures', 'scenarios'].forEach(key => {
          base.experience[key]
            .split(/^\[/m)
            .filter(Boolean)
            .forEach(text => {
              const name = text.match(/^(.*)\](?:\n|$)/)[1];
              const content = text.replace(/^.*\](?:\n|$)/, '').trim();
              unit['experience'][key].push({title: name, content: content, asSystem: true});
            });
        });
      }

      console.log(unit);
      return unit;
    }


    /**
     * 
     * @param {UnitData} unitData 
     * @returns {string}
     */
    function unitdata2charash (unitData) {
      if (!unitData) return;

      const resultArr = [
        "キャラッシュテキスト v1",
        "キャラクターID:\n",
      ];
      
      // ---------------
      //      共通
      // ---------------
      const commonArr = ["【共通情報】\n"];
      {
        // 基本情報
        commonArr.push("【基本情報】\n");
        unitData.profile.forEach((value, key) => {
          if (!value) return;
          if (!['名前','なまえ（かな）','職業','年齢','性別','身長','体重','出身','髪の色','瞳の色','誕生日'].includes(key)) return;
          commonArr.push(`${key}: ${value}`);
        });
        commonArr.push(`ロスト: ${unitData.setting.isLost}`);
        commonArr.push(`年齢の自動算出: ${unitData.setting.autoCalcAge}`);

        // タグ
        if (setting.value.import.tag && unitData.profile.get('タグ')) {
          commonArr.push(`\n【タグ】\n${unitData.profile.get('タグ')}`);
        }

        // 自由項目
        if (
          setting.value.import.skin && unitData.profile.get('肌の色') || 
          setting.value.import.academic && unitData.profile.get('学位')
        ) {
          commonArr.push('\n【自由項目】');
          if (setting.value.import.skin && unitData.profile.get('肌の色')) {
            commonArr.push(`肌の色: ${unitData.profile.get('肌の色')}`);
          }
          if (setting.value.import.academic && unitData.profile.get('学位')) {
            commonArr.push(`学位: ${unitData.profile.get('学位')}`);
          }
        }

        // 共通メモ
        if (unitData.memo.filter(data => !data.asSystem && !data.isSecret).length) {
          commonArr.push('\n【共通メモ】\n');
          commonArr.push(...
            unitData.memo
            .filter(data => !data.asSystem && !data.isSecret)
            .map(data => `---\n【${data.title}】\n${data.content}\n---\n`)
          );
        }
        
        // ネタバレ用メモ（共通用）
        if (unitData.memo.filter(data => !data.asSystem && data.isSecret).length) {
          commonArr.push('\n【ネタバレ用メモ】\n');
          commonArr.push(...
            unitData.memo
            .filter(data => !data.asSystem && data.isSecret)
            .map(data => `---\n【${data.title}】\n${data.content}\n---\n`)
          );
        }

        // 共通の所持品
        if (unitData.item.filter(item => !item.asSystem).length) {
          commonArr.push(
            '\n【共通の所持品】',
            '| 名前 | 個数 | 備考 |'
          );
          commonArr.push(...
            unitData.item
            .filter(item => !item.asSystem)
            .map(item => `| ${item.title} |  | ${item.content} |`)
          );
        }

        // 共通の経験の記録
        {
          if (
            unitData.experience.creatures.filter(data => !data.asSystem).length + 
            unitData.experience.artifacts.filter(data => !data.asSystem).length > 0
          ) cocArr.push('\n【共通の経験の記録】');
          // -- 書物・文献
          // -- 術・呪文
          if (unitData.experience.artifacts.filter(data => !data.asSystem && !/AF|アーティファクト/.test(data.title)).length) {
            let string = '\n術・呪文: "';
            string += unitData.experience.artifacts
              .filter(data => !data.asSystem && !/AF|アーティファクト/.test(data.title))
              .map(data => `${data.title}\n${data.content}`.trim())
              .join('\n\n');
            string += '"';
            cocArr.push(string);
          }
          // -- アーティファクト
          if (unitData.experience.artifacts.filter(data => !data.asSystem && /AF|アーティファクト/.test(data.title)).length) {
            let string = '\nアーティファクト: "';
            string += unitData.experience.artifacts
              .filter(data => !data.asSystem && /AF|アーティファクト/.test(data.title))
              .map(data => `${data.title}\n${data.content}`.trim())
              .join('\n\n');
            string += '"';
            cocArr.push(string);
          }
          // -- 負傷・傷痕など
          // -- 心の傷
          // -- 遭遇した存在
          if (unitData.experience.creatures.filter(data => !data.asSystem).length) {
            let string = '\n遭遇した存在: "';
            string += unitData.experience.creatures
              .filter(data => !data.asSystem)
              .map(data => `${data.title}\n${data.content}`.trim())
              .join('\n\n');
            string += '"';
            cocArr.push(string);
          }
        }
        
        // セッション記録
        if (unitData.experience.scenarios.length) {
          commonArr.push('\n【セッション記録】');
          commonArr.push(...unitData.experience.scenarios.map(data => {
            return `\n［${data.title}］
開始日:
終了日:
GM:
同卓メンバー:
システム: クトゥルフ${unitData.system.coc}
URL:
URLを公開: はい

---
【ひとことメモ】
${data.content}
---`
          }));
        }
      }

      // ---------------
      //   クトゥルフ
      // ---------------
      const cocArr = [`\n【クトゥルフ${unitData.system.coc}】\n`];
      {
        // 能力値
        cocArr.push(
          '【能力値】',
          '| 能力 | 元の値 | 補正 | 合計（参照用） |'
        );
        unitData.status.forEach((value, key) => {
          cocArr.push(`| ${key} | ${value.base} | ${value.diff+value.temp} | ${value.sum} |`);
        });

        // 他能力値
        {
          // SAN補正
          let initSan = unitData.status.get('POW').sum;
          if (unitData.is6th) initSan *= 5;
          cocArr.push(`\nSAN補正: ${unitData.elseStatus.get('SAN').now - Math.min(initSan, unitData.elseStatus.get('SAN').max)}`);
          // HP/MP/IDEA/KNOW
          ['HP', 'MP', 'アイデア', '知識'].forEach(key => {
            if (unitData.isElseStatInit(key)) cocArr.push(`${key}: 0 @自動`);
            else cocArr.push(`${key}: ${unitData.elseStatus.get(key).sum}`);
          });
          // LUCK
          if (unitData.is6th && unitData.isElseStatInit('幸運')) cocArr.push('幸運: 0 @自動');
          else cocArr.push(`幸運: ${unitData.elseStatus.get('幸運').sum}`)
          // DB
          if (unitData.isElseStatInit('ダメージボーナス')) cocArr.push('ダメージボーナス: 0 @自動');
          else cocArr.push(`ダメージボーナス: ${unitData.elseStatus.get('ダメージボーナス')}`);

          // 7th: BLD xx
          // 7th: MOV
          if (!unitData.is6th) {
            let calced = 8;
            if (
              unitData.status.get('STR') < unitData.status.get('SIZ') &&
              unitData.status.get('DEX') < unitData.status.get('SIZ')
            ) calced --;
            cocArr.push(`MOV補正: ${unitData.elseStatus.get('MOV') - calced}`);
          }
        }

        // 技能
        cocArr.push('\n【技能】');
        unitData.skill.forEach((value, key) => {
          cocArr.push(
            `\n［${key}］\n`,
            '| 技能名 | 初期値 | 職業P | 興味P | 成長分 | その他 | 合計（参照用） |'
          );
          const initSkillsMap = initSkills[unitData.system.coc];
          value.forEach((dic, name) => {
            if (/運転|製作|操縦|母国語|ほかの言語|芸術/.test(name)){
              if (dic.job * dic.interest * dic.growth * dic.else === 0) return;
              cocArr.push(`| ${name} | 0 @自動 | ${dic.job} | ${dic.interest} | ${dic.growth} | ${dic.else} | ${dic.sum} |`);

            } else if (initSkillsMap.has(name)) {
              if (dic.sum === initSkillsMap.get(name)) return;
              let init = dic.init !== initSkillsMap.get(name) ? dic.init : '0 @自動';
              cocArr.push(`| ${name} | ${init} | ${dic.job} | ${dic.interest} | ${dic.growth} | ${dic.else} | ${dic.sum} |`);

            } else {
              cocArr.push(`| 独自技能：${name} | ${dic.init} | ${dic.job} | ${dic.interest} | ${dic.growth} | ${dic.else} | ${dic.sum} |`);
            }
          });
        });

        // 武器
        if (unitData.weapon.length) {
          cocArr.push(
            '\n【武器】',
            '| 名称 | 個数 | 備考 | ダメージ | 故障NO | 射程 | 攻撃回数 | 装弾数 | 耐久力 |',
          );
          cocArr.push(...unitData.weapon.map(data => `| ${data.title} |  | ${data.content} |  |  |  |  |  |  |`));
        }

        // システム別の所持品
        if (unitData.item.filter(item => item.asSystem).length) {
          cocArr.push(
            '\n【システム別の所持品】',
            '| 名前 | 個数 | 備考 |'
          );
          cocArr.push(...
            unitData.item
            .filter(item => item.asSystem)
            .map(item => `| ${item.title} |  | ${item.content} |`)
          );
        }

        // システム別の経験の記録
        {
          if (
            unitData.experience.creatures.filter(data => data.asSystem).length + 
            unitData.experience.artifacts.filter(data => data.asSystem).length > 0
          ) cocArr.push('\n【システム別の経験の記録】');
          // -- 書物・文献
          // -- 術・呪文
          if (unitData.experience.artifacts.filter(data => data.asSystem && !/AF|アーティファクト/.test(data.title)).length) {
            let string = '\n術・呪文: "';
            string += unitData.experience.artifacts
              .filter(data => data.asSystem && !/AF|アーティファクト/.test(data.title))
              .map(data => `${data.title}\n${data.content}`.trim())
              .join('\n\n');
            string += '"';
            cocArr.push(string);
          }
          // -- アーティファクト
          if (unitData.experience.artifacts.filter(data => data.asSystem && /AF|アーティファクト/.test(data.title)).length) {
            let string = '\nアーティファクト: "';
            string += unitData.experience.artifacts
              .filter(data => data.asSystem && /AF|アーティファクト/.test(data.title))
              .map(data => `${data.title}\n${data.content}`.trim())
              .join('\n\n');
            string += '"';
            cocArr.push(string);
          }
          // -- 負傷・傷痕など
          // -- 心の傷
          // -- 遭遇した存在
          if (unitData.experience.creatures.filter(data => data.asSystem).length) {
            let string = '\n遭遇した存在: "';
            string += unitData.experience.creatures
              .filter(data => data.asSystem)
              .map(data => `${data.title}\n${data.content}`.trim())
              .join('\n\n');
            string += '"';
            cocArr.push(string);
          }
        }

        // 7th: バックストーリー
        if (!unitData.is6th) {
          cocArr.push('\n【バックストーリー】\n');
          unitData.backstories.forEach((value, key) => {
            if (value) cocArr.push(`---\n【${key}】\n${value}\n---\n`)
          })
        }

        // システム別メモ
        if (unitData.memo.filter(data => data.asSystem).length) {
          cocArr.push('\n【システム別メモ】\n');
          cocArr.push(...unitData.memo
            .filter(data => data.asSystem)
            .map(data => `---\n【${data.title}】\n${data.content}\n---\n`)
          );
        }
      }

      resultArr.push(...commonArr, ...cocArr);
      console.log(resultArr.join('\n'));
      return resultArr.join('\n');
    }


    function clear () {
      unitDatas.value.splice(0);
    }


    // -----------------
    //    to switch
    // -----------------


    onMounted(async () => {
      const json = await fetch('./data/setting.json').then(res=>res.json());
      setting.value = structuredClone(json);
      
      const changeLogJson = await fetch('./data/change-log.json').then(res=>res.json());
      document.querySelector('footer table tbody').innerHTML = changeLogJson.reduce((acc, cur) => acc += `<tr><td>${cur.date}</td><td>${cur.version}</td><td>${cur.detail}</td></tr>`, '');

      const initSkillsJson = await fetch('./data/init-skills.json').then(res=>res.json());
      initSkills['6版'] = new Map(initSkillsJson['6版']);
      initSkills['7版'] = new Map(initSkillsJson['7版']);
    });


    return {
      setting,
      editUnitIndex,
      unitDatas,
      editUnit,
      importIacharaTextFile,
      saveAsCharashTextFile,
      clear,
    }
  }
});
rootApp.mount('#root');
