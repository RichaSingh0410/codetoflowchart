let nodeId = 0;


/* ===============================
   GENERATE FLOWCHART
================================ */

function generateFlowchart() {

    const code = document.getElementById("codeInput").value;
    const flowchart = document.getElementById("flowchart");
    const error = document.getElementById("error");

    flowchart.innerHTML = "";
    error.innerText = "";
    nodeId = 0;

    if (code.trim() === "") {
        error.innerText = "Please enter some Python code.";
        return;
    }

    try {

        const lines = code.split("\n");

        const result = parseBlock(lines, 0, 0);

        const program = result[0];

        drawProgram(program, flowchart);

    } catch (e) {

        console.error(e);

        error.innerText =
            "Unable to generate the flowchart. Please check your code.";

    }
}


/* ===============================
   PARSE BLOCK
================================ */

function parseBlock(lines, start, parentIndent) {

    const result = [];
    let i = start;

    while (i < lines.length) {

        if (
            lines[i].trim() === "" ||
            lines[i].trim().startsWith("#")
        ) {
            i++;
            continue;
        }

        const raw = lines[i];

        const indent = raw.search(/\S/);

        const line = raw.trim();

        if (indent < parentIndent) {
            break;
        }

        if (indent > parentIndent) {
            i++;
            continue;
        }


        /* =========================
           IF
        ========================= */

        if (/^if\s+.*:$/.test(line)) {

            const ifNode = {

                type: "if",

                condition: line
                    .replace(/^if\s+/, "")
                    .replace(/:$/, ""),

                yes: [],

                elif: [],

                no: []

            };

            i++;

            let childIndent = getNextIndent(lines, i);

            if (
                childIndent !== null &&
                childIndent > parentIndent
            ) {

                const parsed =
                    parseBlock(lines, i, childIndent);

                ifNode.yes = parsed[0];

                i = parsed[1];

            }


            /* =========================
               ELIF
            ========================= */

            while (
                i < lines.length &&
                /^elif\s+.*:$/.test(lines[i].trim())
            ) {

                const elifLine = lines[i].trim();

                const elifNode = {

                    condition: elifLine
                        .replace(/^elif\s+/, "")
                        .replace(/:$/, ""),

                    body: []

                };

                i++;

                const elifIndent =
                    getNextIndent(lines, i);

                if (
                    elifIndent !== null &&
                    elifIndent > parentIndent
                ) {

                    const parsed =
                        parseBlock(
                            lines,
                            i,
                            elifIndent
                        );

                    elifNode.body = parsed[0];

                    i = parsed[1];

                }

                ifNode.elif.push(elifNode);

            }


            /* =========================
               ELSE
            ========================= */

            if (
                i < lines.length &&
                lines[i].trim() === "else:"
            ) {

                i++;

                const elseIndent =
                    getNextIndent(lines, i);

                if (
                    elseIndent !== null &&
                    elseIndent > parentIndent
                ) {

                    const parsed =
                        parseBlock(
                            lines,
                            i,
                            elseIndent
                        );

                    ifNode.no = parsed[0];

                    i = parsed[1];

                }

            }

            result.push(ifNode);

        }


        /* =========================
           WHILE
        ========================= */

        else if (/^while\s+.*:$/.test(line)) {

            const node = {

                type: "while",

                condition: line
                    .replace(/^while\s+/, "")
                    .replace(/:$/, ""),

                body: []

            };

            i++;

            const childIndent =
                getNextIndent(lines, i);

            if (
                childIndent !== null &&
                childIndent > parentIndent
            ) {

                const parsed =
                    parseBlock(
                        lines,
                        i,
                        childIndent
                    );

                node.body = parsed[0];

                i = parsed[1];

            }

            result.push(node);

        }


        /* =========================
           FOR
        ========================= */

        else if (/^for\s+.*:$/.test(line)) {

            const node = {

                type: "for",

                condition:
                    line.replace(/:$/, ""),

                body: []

            };

            i++;

            const childIndent =
                getNextIndent(lines, i);

            if (
                childIndent !== null &&
                childIndent > parentIndent
            ) {

                const parsed =
                    parseBlock(
                        lines,
                        i,
                        childIndent
                    );

                node.body = parsed[0];

                i = parsed[1];

            }

            result.push(node);

        }


        /* =========================
           NORMAL STATEMENT
        ========================= */

        else {

            result.push({

                type: "statement",

                text: line

            });

            i++;

        }

    }

    return [result, i];
}


/* ===============================
   GET NEXT INDENT
================================ */

function getNextIndent(lines, index) {

    while (index < lines.length) {

        if (lines[index].trim() !== "") {

            return lines[index].search(/\S/);

        }

        index++;

    }

    return null;
}


/* ===============================
   DRAW PROGRAM
================================ */

function drawProgram(program, container) {

    addNode(
        container,
        "START",
        "start"
    );

    addArrow(container);

    drawSequence(
        program,
        container
    );

    addArrow(container);

    addNode(
        container,
        "END",
        "end"
    );
}


/* ===============================
   DRAW SEQUENCE
================================ */

function drawSequence(program, container) {

    program.forEach(item => {

        if (item.type === "statement") {

            addNode(
                container,
                item.text,
                "process"
            );

            addArrow(container);

        }

        else if (item.type === "if") {

            drawIfElse(
                item,
                container
            );

        }

        else if (item.type === "while") {

            drawLoop(
                item,
                container
            );

        }

        else if (item.type === "for") {

            drawLoop(
                item,
                container
            );

        }

    });
}


/* ===============================
   IF / ELIF / ELSE
================================ */

function drawIfElse(item, container) {

    addNode(
        container,
        item.condition + " ?",
        "diamond"
    );


    const branches =
        document.createElement("div");

    branches.className = "branches";


    /* YES */

    const yes =
        document.createElement("div");

    yes.className = "branch";


    const yesLabel =
        document.createElement("div");

    yesLabel.className = "yes-label";

    yesLabel.innerText = "YES ↓";

    yes.appendChild(yesLabel);


    drawSequence(
        item.yes,
        yes
    );


    branches.appendChild(yes);


    /* NO / ELIF / ELSE */

    const other =
        document.createElement("div");

    other.className = "branch";


    if (item.elif.length > 0) {

        item.elif.forEach(elifItem => {

            const label =
                document.createElement("div");

            label.className = "elif-label";

            label.innerText = "ELIF ↓";

            other.appendChild(label);


            addNode(
                other,
                elifItem.condition + " ?",
                "diamond"
            );


            const elifBody =
                document.createElement("div");

            elifBody.className = "branch";


            const elifYes =
                document.createElement("div");

            elifYes.className = "yes-label";

            elifYes.innerText = "YES ↓";


            elifBody.appendChild(
                elifYes
            );


            drawSequence(
                elifItem.body,
                elifBody
            );


            other.appendChild(
                elifBody
            );

        });

    }


    if (item.no.length > 0) {

        const noLabel =
            document.createElement("div");

        noLabel.className = "no-label";

        noLabel.innerText = "ELSE ↓";


        other.appendChild(
            noLabel
        );


        drawSequence(
            item.no,
            other
        );

    }


    branches.appendChild(other);

    container.appendChild(branches);

    addArrow(container);
}


/* ===============================
   LOOPS
================================ */

function drawLoop(item, container) {

    addNode(
        container,
        item.condition + " ?",
        "diamond"
    );


    const branches =
        document.createElement("div");

    branches.className = "branches";


    /* LOOP BODY */

    const yes =
        document.createElement("div");

    yes.className = "branch";


    const yesLabel =
        document.createElement("div");

    yesLabel.className = "yes-label";

    yesLabel.innerText =
        "YES ↓ (LOOP)";


    yes.appendChild(
        yesLabel
    );


    drawSequence(
        item.body,
        yes
    );


    /* EXIT */

    const no =
        document.createElement("div");

    no.className = "branch";


    const noLabel =
        document.createElement("div");

    noLabel.className = "no-label";

    noLabel.innerText =
        "NO ↓ (EXIT)";


    no.appendChild(
        noLabel
    );


    branches.appendChild(yes);

    branches.appendChild(no);

    container.appendChild(branches);


    const loopBack =
        document.createElement("div");

    loopBack.className =
        "loop-back";

    loopBack.innerText =
        "↩ Repeat loop";


    container.appendChild(
        loopBack
    );

    addArrow(container);
}


/* ===============================
   ADD NODE
================================ */

function addNode(
    container,
    text,
    type
) {

    const node =
        document.createElement("div");

    node.className =
        "flow-box " + type;

    node.innerText = text;

    container.appendChild(node);
}


/* ===============================
   ADD ARROW
================================ */

function addArrow(container) {

    const arrow =
        document.createElement("div");

    arrow.className =
        "arrow";

    arrow.innerHTML = "↓";

    container.appendChild(
        arrow
    );
}


/* ===============================
   CLEAR
================================ */

function clearAll() {

    document.getElementById(
        "codeInput"
    ).value = "";

    document.getElementById(
        "flowchart"
    ).innerHTML = "";

    document.getElementById(
        "error"
    ).innerText = "";

}


/* ===============================
   DOWNLOAD FLOWCHART
================================ */

function downloadFlowchart() {

    const flowchart =
        document.getElementById(
            "flowchart"
        );

    if (
        flowchart.innerText.trim() === ""
    ) {

        alert(
            "Generate a flowchart first."
        );

        return;
    }

    const content =
        flowchart.innerText;

    const blob =
        new Blob(
            [content],
            {
                type: "text/plain"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "flowchart.txt";

    link.click();

    URL.revokeObjectURL(url);
}