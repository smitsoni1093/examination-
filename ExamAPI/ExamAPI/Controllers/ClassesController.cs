using System.Security.Claims;
using ExamAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExamAPI.Controllers
{
    [ApiController]
    [Route("api/classes")]
    [Authorize(Roles = "Admin")]
    public class ClassesController : ControllerBase
    {
        private readonly ClassService _classService;

        public ClassesController(ClassService classService) => _classService = classService;

        private int GetAdminId()
        {
            var adminIdClaim = User.FindFirstValue("AdminId");
            if (string.IsNullOrWhiteSpace(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
                throw new UnauthorizedAccessException("AdminId claim missing.");
            return adminId;
        }

        public record CreateClassRequest(string Name);

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClassRequest req)
        {
            try
            {
                var created = await _classService.CreateClassAsync(GetAdminId(), req.Name);
                return Ok(new { created.Id, created.Name, created.CreatedAt });
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var classes = await _classService.GetClassesForAdminAsync(GetAdminId());
            return Ok(classes.Select(c => new { c.Id, c.Name, c.CreatedAt }));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _classService.DeleteClassAsync(GetAdminId(), id);
                return Ok(new { message = "Class deleted successfully." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }
    }
}
