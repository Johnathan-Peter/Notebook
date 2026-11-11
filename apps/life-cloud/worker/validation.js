
      "use strict";
      // 02 / Data model, local calendar helpers and persistence (one key only).
      const KEY = "notebook.life.v1",
        CATS = ["有氧", "胸", "背", "肩", "腿"],
        TOPICS = ["读书", "写作", "副业", "技能", "其他"];
      const defaults = {
        study: 180,
        sleep: 8,
        exercise: 3,
        explore: 30,
        theme: "dark",
        unit: "minutes",
      };
      const $ = (s) => document.querySelector(s),
        $$ = (s) => [...document.querySelectorAll(s)];
      const esc = (x) =>
        String(x ?? "").replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[c],
        );
      const num = (x) => Math.max(0, Number(x) || 0),
        round = (x) => Math.round(x * 10) / 10;
      function key(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      function shift(k, n) {
        const d = new Date(k + "T12:00:00");
        d.setDate(d.getDate() + n);
        return key(d);
      }
      const today = () => key(new Date());
      let selected = today(),
        month = selected.slice(0, 7),
        view = "daily",
        timer,
        toastTimer,
        storageBroken = false;
      function blank() {
        return {
          study: [],
          studyNote: "",
          sleep: { bed: "", wake: "", quality: "", note: "" },
          exercise: [],
          exerciseNote: "",
          meals: { breakfast: {}, lunch: {}, dinner: {} },
          mealNote: "",
          explore: [],
          exploreNote: "",
        };
      }
      function validDate(k) {
        return (
          /^\d{4}-\d{2}-\d{2}$/.test(k) &&
          !isNaN(new Date(k + "T12:00:00")) &&
          key(new Date(k + "T12:00:00")) === k
        );
      }
      // Validate backups and stored values before allowing them into forms/statistics.
      function validate(raw) {
        if (
          !raw ||
          typeof raw !== "object" ||
          !raw.records ||
          typeof raw.records !== "object" ||
          Array.isArray(raw.records) ||
          !raw.settings ||
          typeof raw.settings !== "object"
        )
          throw Error("备份格式不正确");
        const settings = { ...defaults };
        for (const k of ["study", "sleep", "exercise", "explore"])
          if (raw.settings[k] !== undefined) {
            const v = Number(raw.settings[k]);
            if (
              !Number.isFinite(v) ||
              v <= 0 ||
              v > ({ sleep: 24, exercise: 7 }[k] || 1440)
            )
              throw Error("目标数值不正确");
            settings[k] = v;
          }
        if (["dark", "light"].includes(raw.settings.theme))
          settings.theme = raw.settings.theme;
        if (["minutes", "hours"].includes(raw.settings.unit))
          settings.unit = raw.settings.unit;
        const records = {};
        const str = (v) => {
          if (v === undefined || v === null) return "";
          if (typeof v !== "string" || v.length > 20000)
            throw Error("文本格式不正确");
          return v;
        };
        const numeric = (v, max) => {
          if (v === undefined || v === "") return "";
          if (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > max)
            throw Error("记录数值不正确");
          return Number(v);
        };
        for (const [date, r] of Object.entries(raw.records)) {
          if (!validDate(date) || !r || typeof r !== "object")
            throw Error("日期或记录格式不正确");
          const b = blank();
          for (const n of [
            "studyNote",
            "exerciseNote",
            "mealNote",
            "exploreNote",
          ])
            b[n] = str(r[n]);
          for (const type of ["study", "exercise", "explore"]) {
            if (r[type] !== undefined && !Array.isArray(r[type]))
              throw Error("记录列表格式不正确");
            b[type] = (r[type] || []).map((i) => {
              if (!i || typeof i !== "object") throw Error("记录项格式不正确");
              return type === "exercise"
                ? {
                    category: CATS.includes(i.category) ? i.category : "有氧",
                    action: str(i.action),
                    sets: numeric(i.sets, 1000),
                    minutes: numeric(i.minutes, 1440),
                    rpe: numeric(i.rpe, 10),
                    note: str(i.note),
                  }
                : type === "study"
                  ? {
                      content: str(i.content),
                      minutes: numeric(i.minutes, 1440),
                      note: str(i.note),
                    }
                  : {
                      topic: TOPICS.includes(i.topic) ? i.topic : "其他",
                      minutes: numeric(i.minutes, 1440),
                      note: str(i.note),
                    };
            });
          }
          const s = r.sleep || {};
          for (const t of ["bed", "wake"]) {
            b.sleep[t] = str(s[t]);
            if (b.sleep[t] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.sleep[t]))
              throw Error("时间格式不正确");
          }
          b.sleep.quality = numeric(s.quality, 5);
          if (
            b.sleep.quality !== "" &&
            (!Number.isInteger(b.sleep.quality) || b.sleep.quality < 1)
          )
            throw Error("睡眠质量应为 1–5");
          b.sleep.note = str(s.note);
          for (const m of ["breakfast", "lunch", "dinner"]) {
            const x = r.meals?.[m] || {};
            b.meals[m] = {
              status: ["已吃", "未吃"].includes(x.status) ? x.status : "",
              content: str(x.content),
              source: ["自制", "外卖", "其他"].includes(x.source)
                ? x.source
                : "",
              health: ["好", "一般", "差"].includes(x.health) ? x.health : "",
              note: str(x.note),
            };
          }
          records[date] = b;
        }
        return { records, settings };
      }

export {validate,defaults};
