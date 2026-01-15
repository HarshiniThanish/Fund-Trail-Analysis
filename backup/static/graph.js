async function fetchBranchInfo(ifsc) {
  try {
    const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
    if (!res.ok) throw new Error("Invalid IFSC");
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch IFSC details:", e);
    return {};
  }
}

const layerColors = {
  1: '#EF4444', 2: '#F97316', 3: '#10B981',
  4: '#FBBF24', 5: '#14B8A6', 6: '#6366F1',
  7: '#8B5CF6', 8: '#EC4899', 9: '#06B6D4', 10: '#22C55E'
};

const tooltip = d3.select('.tooltip');
const detailsPanel = document.getElementById('detailsPanel');
const detailsContent = document.getElementById('detailsContent');
const closeBtn = document.getElementById('closeDetails');
closeBtn.onclick = () => detailsPanel.style.display = 'none';

const leftPanel = document.getElementById('leftPanel');
const leftContent = document.getElementById('leftContent');
const closeLeft = document.getElementById('closeLeftPanel');
closeLeft.onclick = () => leftPanel.style.display = 'none';

let width, height, svg, g, currentRoot = null;

// Resize & init
svg = d3.select('#treeSvg');
g = svg.append('g').attr('transform', 'translate(80,80)');
svg.call(d3.zoom().scaleExtent([0.5, 3]).on('zoom', e => g.attr('transform', e.transform)));

function resizeTree() {
  const headerH = document.querySelector('header')?.clientHeight || 0;
  width = window.innerWidth;
  height = window.innerHeight - headerH;
  svg.attr('width', width).attr('height', height);
}
window.addEventListener('resize', () => {
  resizeTree();
  drawTree(currentRoot);
});
resizeTree();

// Fetch & draw
fetch(`/graph_data/${ackNo}`)
  .then(res => res.json())
  .then(data => {
    if (data.error) return alert("No graph data found for this Ack No.");
    const root = d3.hierarchy(data);
    bfsAssignLayers(root);
    root.descendants().forEach(d => {
      if (d.depth > 0) {
        d._children = d.children;
        d.children = null;
      }
    });
    let count = 1;
    root.children?.forEach(child => {
      child.data.victim_label = `Victim ${count++}`;
    });
    currentRoot = root;
    drawTree(root);
  });

function bfsAssignLayers(root) {
  const queue = [root];
  root.data.layer = 1;
  while (queue.length > 0) {
    const node = queue.shift();
    const currentLayer = node.data.layer || 1;
    if (node.children) {
      node.children.forEach(child => {
        if (!child.data.layer || child.data.layer < currentLayer + 1) {
          child.data.layer = currentLayer + 1;
        }
        queue.push(child);
      });
    }
  }
}

function toggleCollapse(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else if (d._children) {
    d.children = d._children;
    d._children = null;
  }
}

function drawTree(root) {
  g.selectAll('*').remove();
  const layerHeight = 150;
  root.each(d => d.y = (d.data.layer - 1) * layerHeight);
  const treeLayout = d3.tree().nodeSize([180, 120]);
  treeLayout(root);

  // Draw links
  g.selectAll('.link')
    .data(root.links())
    .join('path')
    .attr('class', 'link')
    .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y))
    .attr('stroke', '#888')
    .attr('stroke-width', 1.5)
    .attr('fill', 'none');

  // Draw nodes
  const nodes = g.selectAll('.node')
    .data(root.descendants())
    .join('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x},${d.y})`);
  let victimCounter = 1;
  nodes.each(function (d) {
    const n = d3.select(this);
    const boxWidth = 200, boxHeight = 80;

    // Box
    n.append('rect')
      .attr('x', -boxWidth / 2)
      .attr('y', -boxHeight / 2)
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('rx', 14)
      .attr('fill', layerColors[d.data.layer] || '#ccc')
      .attr('stroke', d.data.hold_info ? '#dc2626' : '#1e293b')
      .attr('stroke-width', d.data.hold_info ? 3 : 1.5)
      .style('filter', d.data.hold_info
        ? 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.7))'
        : 'drop-shadow(2px 2px 6px rgba(0,0,0,0.15))');

    n.selectAll('text').remove();

    if (d.depth === 0) {
  // Root node
  n.append('text')
    .attr('x', 0)
    .attr('y', -10) // move label slightly up
    .attr('text-anchor', 'middle')
    .style('font-size', '13px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text('Acknowledgement No');

  n.append('text')
    .attr('x', 0)
    .attr('y', 10) // move value slightly below label
    .attr('text-anchor', 'middle')
    .style('font-size', '13px')
    .style('fill', '#000')
    .text(ackNo); // actual number
}

   if (d.depth === 1) {
  // Assign victim number
  const victimNo = victimCounter++;

  // Line 1: Victim Number
  n.append('text')
    .attr('x', 0)
    .attr('y', -14)
    .attr('text-anchor', 'middle')
    .style('font-size', '13px')
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .text(`Victim Account No: ${victimNo}`);

  // Line 2: Account Number
  n.append('text')
    .attr('x', 0)
    .attr('y', 6)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#000')
    .text(`Acc No: ${d.data.name || 'N/A'}`);

  // Line 3: Amount
 
}

    else if (d.data.layer > 2) {
      // All nodes below victim
      n.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .style('fill', '#000')
        .text(`Acc No:${d.data.name || "Acc ?"}`);

      n.append('text')
        .attr('x', 0)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#000')
        .text(d.data.amt !== undefined && d.data.amt !== null 
  ? `Amt: ₹${d.data.amt}` 
  : "Amt: No Amt");

    }

    // ATM icon
    if (d.data.atm_info) {
      addIcon(n, -boxWidth / 2 + 20, 30, '💳', () => {
        leftContent.innerHTML =
          `<strong>ATM Withdrawal</strong><br>` +
          `Account: ${d.data.name}<br>` +
          `ATM ID: ${d.data.atm_info.atm_id}<br>` +
          `Amount: ₹${d.data.atm_info.amount}<br>` +
          `Date: ${d.data.atm_info.date}`;
        leftPanel.style.display = 'block';
        if (d.data.cheque_info?.ifsc) {
          fetchBranchInfo(d.data.cheque_info.ifsc).then(branchData => {
            const branchName = branchData?.BRANCH || 'Not found';
            const branchSpan = document.getElementById(`branch-${d.data.name}`);
            if (branchSpan) branchSpan.innerHTML = `Branch: ${branchName}`;
          });
        }
      });
    }

    // Cheque icon
    if (d.data.cheque_info) {
      addIcon(n, boxWidth / 2 - 20, 30, '🧾', () => {
        leftContent.innerHTML =
          `<strong>Cheque Withdrawal</strong><br>` +
          `Account: ${d.data.name}<br>` +
          `Cheque No: ${d.data.cheque_info.cheque_no}<br>` +
          `IFSC: ${d.data.cheque_info.ifsc}<br>` +
          `<span id='branch-${d.data.name}'>Loading branch...</span><br>` +
          `Amount: ₹${d.data.cheque_info.amount}<br>` +
          `IFSC: ${d.data.cheque_info.ifsc}<br>` +
          `Date: ${d.data.cheque_info.date}`;
        leftPanel.style.display = 'block';
        if (d.data.cheque_info?.ifsc) {
          fetchBranchInfo(d.data.cheque_info.ifsc).then(branchData => {
            const branchName = branchData?.BRANCH || 'Not found';
            const branchSpan = document.getElementById(`branch-${d.data.name}`);
            if (branchSpan) branchSpan.innerHTML = `Branch: ${branchName}`;
          });
        }
      });
    }

    // Hold Icon
    if (d.data.hold_info) {
      addIcon(n, 0, 30, '🔒', () => {
        leftContent.innerHTML =
          `<strong>Amount Put on Hold</strong><br>` +
          `Account: ${d.data.name}<br>` +
          `Txn ID: ${d.data.hold_info.txn_id}<br>` +
          `Amount: ₹${d.data.hold_info.amount}<br>` +
          `Date: ${d.data.hold_info.date}`;
        leftPanel.style.display = 'block';
        if (d.data.cheque_info?.ifsc) {
          fetchBranchInfo(d.data.cheque_info.ifsc).then(branchData => {
            const branchName = branchData?.BRANCH || 'Not found';
            const branchSpan = document.getElementById(`branch-${d.data.name}`);
            if (branchSpan) branchSpan.innerHTML = `Branch: ${branchName}`;
          });
        }
      });
    }

    // Click / Double-click logic
    let clickTimer;
    n.on('click', function (event) {
      if (event.target.classList.contains('icon')) return;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        toggleCollapse(d);
        drawTree(currentRoot);
      }, 180);
    }).on('dblclick', () => {
      clearTimeout(clickTimer);
      detailsContent.innerHTML =
        `<div class="detail-row"><span class="label">Layer:</span> ${d.data.layer - 1 || '—'}</div>` +
        `<div class="detail-row"><span class="label">Account:</span> ${d.data.name || '—'}</div>` +
        `<div class="detail-row"><span class="label">Ack No:</span> ${d.data.ack || '—'}</div>` +
        `<div class="detail-row"><span class="label">IFSC:</span> ${d.data.ifsc || '—'}</div>` +
        `<div class="detail-row" id="branch-${d.data.name}">Branch: Loading...</div>` +
        `<div class="detail-row"><span class="label">Bank/FI:</span> ${d.data.bank || '—'}</div>` +
        `<div class="detail-row"><span class="label">Date:</span> ${d.data.date || '—'}</div>` +
        `<div class="detail-row"><span class="label">Txn ID:</span> ${d.data.txid || '—'}</div>` +
        `<div class="detail-row"><span class="label">Amount:</span> ₹${d.data.amt || '0.0'}</div>` +
        `<div class="detail-row"><span class="label">Disputed:</span> ₹${d.data.disputed || '0.0'}</div>` +
        `<div class="detail-row"><span class="label">Action:</span> ${d.data.action || '—'}</div>` +
        `<div class="kyc-icon" style="position:absolute; top:10px; right:50px; cursor:pointer; font-size:20px" title="KYC Form">📄</div>`;
      const kycIcon = document.querySelector('.kyc-icon');
      kycIcon.onclick = () => {
        detailsContent.innerHTML +=
          `<form id="kycForm" style="margin-top:10px;">
            <div class="detail-row"><label><b>Holder Name:</b></label><input name="name" required></div>
            <div class="detail-row"><label><b>Aadhaar No:</b></label><input name="aadhaar" required></div>
            <div class="detail-row"><label><b>Mobile No:</b></label><input name="mobile" required></div>
            <div class="detail-row"><label><b>Address:</b></label><textarea name="address" required></textarea></div>
            <button type="submit">Save KYC</button>
          </form>`;
        document.getElementById('kycForm').onsubmit = e => {
          e.preventDefault();
          alert("KYC saved for account: " + d.data.name);
        };
      };
      detailsPanel.style.display = 'block';
      if (d.data.ifsc) {
        fetchBranchInfo(d.data.ifsc).then(branchData => {
          const branchName = branchData?.BRANCH || 'Not found';
          const branchEl = document.getElementById(`branch-${d.data.name}`);
          if (branchEl) branchEl.innerHTML = `<span class="label">Branch:</span> ${branchName}`;
        });
      }
    });
  });
}

// Helper for adding icons
function addIcon(container, x, y, emoji, onClick) {
  container.append('circle')
    .attr('cx', x).attr('cy', y).attr('r', 14)
    .attr('fill', '#ffffffcc').attr('stroke', '#1e293b').attr('stroke-width', 1);
  container.append('text')
    .attr('x', x).attr('y', y + 5).attr('text-anchor', 'middle')
    .attr('class', 'icon')
    .style('font-size', '18px').style('cursor', 'pointer').style('fill', '#000')
    .text(emoji).on('click', onClick);
}